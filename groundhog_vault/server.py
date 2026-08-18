from __future__ import annotations

import argparse
import json
import os
import re
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from .experiment import ExperimentSession
from .storage import ExperimentStore
from .treasury import TreasuryWorkflow


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = PROJECT_ROOT / "web"
DATA_ROOT = PROJECT_ROOT / ".data"
STORE = ExperimentStore(DATA_ROOT)
TREASURY = TreasuryWorkflow(DATA_ROOT / "treasury.db")
STORE_LOCK = threading.Lock()
LIFE_ENDPOINT = re.compile(r"^/api/runs/([a-f0-9]{32})/lives$")
RUN_ENDPOINT = re.compile(r"^/api/runs/([a-f0-9]{32})$")
MAX_REQUEST_BYTES = 16_384


def _public_snapshot(session: ExperimentSession) -> dict[str, Any]:
    payload = session.snapshot()
    payload["database_path"] = session.database_path.name
    return payload


class GroundhogRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("invalid content length") from error
        if content_length > MAX_REQUEST_BYTES:
            raise OverflowError("request body is too large")
        if content_length == 0:
            return {}
        payload = json.loads(self.rfile.read(content_length))
        if not isinstance(payload, dict):
            raise ValueError("request body must be a JSON object")
        return payload

    def do_GET(self) -> None:  # noqa: N802 - standard library handler name
        path = urlsplit(self.path).path
        if path == "/api/health":
            self._send_json({"ok": True, "service": "groundhog-vault"})
            return
        if path == "/api/config":
            contract_address = os.environ.get("BASE_RECEIPT_CONTRACT", "").strip()
            if not re.fullmatch(r"0x[a-fA-F0-9]{40}", contract_address):
                contract_address = ""
            self._send_json(
                {
                    "base": {
                        "chain_id": 84532,
                        "chain_id_hex": "0x14a34",
                        "network": "Base Sepolia",
                        "rpc_url": "https://sepolia.base.org",
                        "explorer_url": "https://sepolia-explorer.base.org",
                        "receipt_contract": contract_address or None,
                    }
                }
            )
            return
        run_match = RUN_ENDPOINT.match(path)
        if run_match:
            with STORE_LOCK:
                session = STORE.load(run_match.group(1))
            if session is None:
                self._send_json({"error": "run_not_found"}, HTTPStatus.NOT_FOUND)
                return
            self._send_json(_public_snapshot(session))
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - standard library handler name
        try:
            path = urlsplit(self.path).path
            payload = self._read_json()

            if path == "/api/runs":
                with STORE_LOCK:
                    session = STORE.create()
                self._send_json(_public_snapshot(session), HTTPStatus.CREATED)
                return

            life_match = LIFE_ENDPOINT.match(path)
            if life_match:
                run_id = life_match.group(1)
                with STORE_LOCK:
                    session = STORE.load(run_id)
                    if session is None:
                        self._send_json({"error": "run_not_found"}, HTTPStatus.NOT_FOUND)
                        return
                    if session.complete:
                        self._send_json(
                            {"error": "run_complete", "run": _public_snapshot(session)},
                            HTTPStatus.CONFLICT,
                        )
                        return
                    session.run_next_life()
                    STORE.save(session)
                    payload = _public_snapshot(session)
                self._send_json(payload)
                return

            if path == "/api/treasury/incidents":
                with STORE_LOCK:
                    incident = TREASURY.submit_incident(payload)
                self._send_json(incident, HTTPStatus.CREATED)
                return

            if path == "/api/treasury/evaluations":
                with STORE_LOCK:
                    evaluation = TREASURY.evaluate_proposal(payload)
                self._send_json(evaluation)
                return

            self._send_json({"error": "not_found"}, HTTPStatus.NOT_FOUND)
        except OverflowError as error:
            self._send_json(
                {"error": "request_too_large", "detail": str(error)},
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            self._send_json(
                {"error": "invalid_request", "detail": str(error)},
                HTTPStatus.UNPROCESSABLE_ENTITY,
            )
        except Exception as error:
            self._send_json(
                {"error": "experiment_failed", "detail": str(error)},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[groundhog-web] {self.address_string()} {format % args}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="groundhog-serve")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "4173")))
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), GroundhogRequestHandler)
    print(f"Groundhog Vault available at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
