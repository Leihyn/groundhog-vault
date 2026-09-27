"""Chain configuration for the front end. Mirrors GET /api/config on the long-running server."""

from __future__ import annotations

import json
import os
import re
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        contract = os.environ.get("BASE_RECEIPT_CONTRACT", "").strip()
        if not re.fullmatch(r"0x[a-fA-F0-9]{40}", contract):
            contract = ""

        body = json.dumps(
            {
                "base": {
                    "chain_id": 84532,
                    "chain_id_hex": "0x14a34",
                    "network": "Base Sepolia",
                    "rpc_url": "https://sepolia.base.org",
                    "explorer_url": "https://sepolia-explorer.base.org",
                    "receipt_contract": contract or None,
                },
                # Treasury forms need a database that persists across requests,
                # which serverless functions cannot provide. Hide them here.
                "treasury": False,
            }
        ).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
