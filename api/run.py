"""Run one complete Groundhog experiment inside a single request.

Why one request instead of the stepwise /api/runs + /api/runs/{id}/lives pair the
long-running server exposes: on serverless there is no disk that survives between
invocations, so a run created by one request may not be visible to the next. The
experiment is 2 lives and finishes in about 0.09s, so running it to completion here
costs nothing and removes the need for shared state entirely.

The Sibyl memory database still needs a real file, so it lives in a temporary
directory for the lifetime of this request. That is the whole point of the
experiment: the groundhog arm reads the database it just wrote, the amnesiac arm
never gets the channel.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _run_experiment() -> dict:
    from groundhog_vault.storage import ExperimentStore

    with tempfile.TemporaryDirectory() as root:
        store = ExperimentStore(root)
        session = store.create()
        while not session.complete:
            session.run_next_life()
        payload = session.snapshot()
        payload["database_path"] = session.database_path.name
        return payload


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            payload = _run_experiment()
            status = 200
        except Exception as error:  # surface the reason rather than a blank 500
            payload = {"error": "experiment_failed", "detail": str(error)}
            status = 500

        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
