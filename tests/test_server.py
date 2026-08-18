from __future__ import annotations

import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from groundhog_vault import server
from groundhog_vault.storage import ExperimentStore

WORKSPACE_A = "a" * 32
WORKSPACE_B = "b" * 32
RISK_SIGNALS = {
    "incentive_funded_yield": 0.85,
    "liquidity_concentration": 0.80,
    "exit_liquidity": 0.20,
    "peg_instability": 0.75,
}


class GroundhogServerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.original_store = server.STORE
        self.original_treasury_root = server.TREASURY_ROOT
        data_root = Path(self.temporary.name)
        server.STORE = ExperimentStore(data_root)
        server.TREASURY_ROOT = data_root / "treasury"
        self.httpd = ThreadingHTTPServer(
            ("127.0.0.1", 0), server.GroundhogRequestHandler
        )
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.origin = f"http://127.0.0.1:{self.httpd.server_port}"

    def tearDown(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=2)
        server.STORE = self.original_store
        server.TREASURY_ROOT = self.original_treasury_root
        self.temporary.cleanup()

    def request(
        self, method: str, path: str, payload: object | None = None
    ) -> tuple[int, object]:
        data = None if payload is None else json.dumps(payload).encode()
        request = Request(
            f"{self.origin}{path}",
            data=data,
            method=method,
            headers={"Content-Type": "application/json"} if data is not None else {},
        )
        try:
            response = urlopen(request, timeout=3)
        except HTTPError as error:
            with error:
                return error.code, json.loads(error.read())
        with response:
            return response.status, json.loads(response.read())

    def raw_request(self, path: str, body: bytes) -> tuple[int, object]:
        request = Request(
            f"{self.origin}{path}",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            response = urlopen(request, timeout=3)
        except HTTPError as error:
            with error:
                return error.code, json.loads(error.read())
        with response:
            return response.status, json.loads(response.read())

    def test_complete_experiment_api_and_conflict(self) -> None:
        status, created = self.request("POST", "/api/runs", {})
        self.assertEqual(status, 201)
        run_id = created["run_id"]
        self.assertRegex(run_id, r"^[a-f0-9]{32}$")
        self.assertEqual(created["database_path"], f"{run_id}.db")

        status, restored = self.request("GET", f"/api/runs/{run_id}")
        self.assertEqual(status, 200)
        self.assertEqual(restored["next_life_number"], 1)

        status, life_one = self.request("POST", f"/api/runs/{run_id}/lives", {})
        self.assertEqual(status, 200)
        self.assertEqual(
            life_one["groundhog"]["lives"][0]["decision"]["allocation_fraction"], 0.30
        )
        self.assertEqual(
            life_one["amnesiac"]["lives"][0]["decision"]["allocation_fraction"], 0.30
        )

        status, life_two = self.request("POST", f"/api/runs/{run_id}/lives", {})
        self.assertEqual(status, 200)
        self.assertTrue(life_two["complete"])
        self.assertEqual(
            life_two["groundhog"]["lives"][1]["decision"]["allocation_fraction"], 0.05
        )
        self.assertEqual(
            life_two["amnesiac"]["lives"][1]["decision"]["allocation_fraction"], 0.30
        )
        self.assertEqual(life_two["memory_lift"], 12_300.0)

        status, conflict = self.request("POST", f"/api/runs/{run_id}/lives", {})
        self.assertEqual(status, 409)
        self.assertEqual(conflict["error"], "run_complete")

    def test_treasury_memory_is_isolated_by_browser_workspace(self) -> None:
        incident = {
            "workspace_id": WORKSPACE_A,
            "protocol_name": "Northstar USD",
            "loss": 18_000,
            "advertised_apy": 0.27,
            "signals": RISK_SIGNALS,
        }
        status, stored = self.request("POST", "/api/treasury/incidents", incident)
        self.assertEqual(status, 201)

        proposal = {
            "protocol_name": "Harbor Yield",
            "advertised_apy": 0.22,
            "signals": RISK_SIGNALS,
        }
        status, recalled = self.request(
            "POST",
            "/api/treasury/evaluations",
            {**proposal, "workspace_id": WORKSPACE_A},
        )
        self.assertEqual(status, 200)
        self.assertEqual(recalled["decision"]["allocation_fraction"], 0.05)
        self.assertEqual(
            recalled["recalled_policy"]["source_incident_id"], stored["incident_id"]
        )

        status, isolated = self.request(
            "POST",
            "/api/treasury/evaluations",
            {**proposal, "workspace_id": WORKSPACE_B},
        )
        self.assertEqual(status, 200)
        self.assertEqual(isolated["decision"]["allocation_fraction"], 0.30)
        self.assertIsNone(isolated["recalled_policy"])

    def test_validation_and_not_found_errors_are_structured(self) -> None:
        status, missing_workspace = self.request(
            "POST",
            "/api/treasury/evaluations",
            {
                "protocol_name": "No Workspace",
                "advertised_apy": 0.22,
                "signals": RISK_SIGNALS,
            },
        )
        self.assertEqual(status, 422)
        self.assertEqual(missing_workspace["error"], "invalid_request")

        status, non_finite = self.request(
            "POST",
            "/api/treasury/incidents",
            {
                "workspace_id": WORKSPACE_A,
                "protocol_name": "Invalid Incident",
                "loss": float("nan"),
                "advertised_apy": 0.27,
                "signals": RISK_SIGNALS,
            },
        )
        self.assertEqual(status, 422)
        self.assertIn("finite", non_finite["detail"])

        status, missing_run = self.request("GET", f"/api/runs/{'f' * 32}")
        self.assertEqual(status, 404)
        self.assertEqual(missing_run["error"], "run_not_found")

        status, missing_route = self.request("POST", "/api/does-not-exist", {})
        self.assertEqual(status, 404)
        self.assertEqual(missing_route["error"], "not_found")

    def test_config_sanitizes_contract_address(self) -> None:
        with patch.dict(os.environ, {"BASE_RECEIPT_CONTRACT": "not-an-address"}):
            status, invalid = self.request("GET", "/api/config")
        self.assertEqual(status, 200)
        self.assertIsNone(invalid["base"]["receipt_contract"])
        self.assertEqual(invalid["base"]["chain_id"], 84532)

        address = "0x" + "12" * 20
        with patch.dict(os.environ, {"BASE_RECEIPT_CONTRACT": address}):
            status, configured = self.request("GET", "/api/config")
        self.assertEqual(status, 200)
        self.assertEqual(configured["base"]["receipt_contract"], address)

    def test_malformed_and_oversized_requests_are_rejected(self) -> None:
        status, malformed = self.raw_request("/api/runs", b"{")
        self.assertEqual(status, 422)
        self.assertEqual(malformed["error"], "invalid_request")

        status, wrong_shape = self.raw_request("/api/runs", b"[]")
        self.assertEqual(status, 422)
        self.assertIn("JSON object", wrong_shape["detail"])

        status, oversized = self.raw_request(
            "/api/runs", b"x" * (server.MAX_REQUEST_BYTES + 1)
        )
        self.assertEqual(status, 413)
        self.assertEqual(oversized["error"], "request_too_large")

    def test_static_responses_include_security_headers(self) -> None:
        with urlopen(f"{self.origin}/", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
            self.assertEqual(response.headers["Referrer-Policy"], "no-referrer")
            self.assertEqual(response.headers["X-Frame-Options"], "DENY")
            self.assertIn(
                "frame-ancestors 'none'", response.headers["Content-Security-Policy"]
            )


if __name__ == "__main__":
    unittest.main()
