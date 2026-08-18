from __future__ import annotations

import argparse
import json
import re
import threading
from datetime import UTC, datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from .experiment import ExperimentSession, create_experiment_session


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = PROJECT_ROOT / "web"
DATA_ROOT = PROJECT_ROOT / ".data"
RUNS: dict[str, ExperimentSession] = {}
RUNS_LOCK = threading.Lock()
LIFE_ENDPOINT = re.compile(r"^/api/runs/([a-f0-9]{32})/lives$")
MAX_REQUEST_BYTES = 1024


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

    def do_GET(self) -> None:  # noqa: N802 - standard library handler name
        if self.path == "/api/health":
            self._send_json({"ok": True, "service": "groundhog-vault"})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - standard library handler name
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length > MAX_REQUEST_BYTES:
                self._send_json({"error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
                return
            if content_length:
                self.rfile.read(content_length)

            if self.path == "/api/runs":
                DATA_ROOT.mkdir(parents=True, exist_ok=True)
                stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
                database = DATA_ROOT / f"web-{stamp}.db"
                session = create_experiment_session(database_path=database)
                with RUNS_LOCK:
                    RUNS[session.run_id] = session
                    if len(RUNS) > 20:
                        oldest_run_id = next(iter(RUNS))
                        RUNS.pop(oldest_run_id, None)
                self._send_json(_public_snapshot(session), HTTPStatus.CREATED)
                return

            life_match = LIFE_ENDPOINT.match(self.path)
            if life_match:
                run_id = life_match.group(1)
                with RUNS_LOCK:
                    session = RUNS.get(run_id)
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
                    payload = _public_snapshot(session)
                self._send_json(payload)
                return

            self._send_json({"error": "not_found"}, HTTPStatus.NOT_FOUND)
        except Exception as error:
            self._send_json(
                {"error": "experiment_failed", "detail": str(error)},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[groundhog-web] {self.address_string()} {format % args}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="groundhog-serve")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
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
