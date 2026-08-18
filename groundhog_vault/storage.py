from __future__ import annotations

import json
import re
from pathlib import Path

from .experiment import ExperimentSession, create_experiment_session

RUN_ID = re.compile(r"^[a-f0-9]{32}$")


class ExperimentStore:
    """Disk-backed experiment sessions with atomic state updates."""

    def __init__(self, data_root: str | Path):
        self.data_root = Path(data_root)
        self.runs_root = self.data_root / "runs"
        self.memory_root = self.data_root / "memory"
        self.runs_root.mkdir(parents=True, exist_ok=True)
        self.memory_root.mkdir(parents=True, exist_ok=True)

    def create(self) -> ExperimentSession:
        session = create_experiment_session(
            database_path=self.memory_root / "pending.db",
        )
        session.database_path = self.memory_root / f"{session.run_id}.db"
        self.save(session)
        return session

    def save(self, session: ExperimentSession) -> None:
        if not RUN_ID.fullmatch(session.run_id):
            raise ValueError("invalid run id")
        payload = session.snapshot()
        payload["database_path"] = session.database_path.name
        destination = self.runs_root / f"{session.run_id}.json"
        temporary = destination.with_suffix(".tmp")
        temporary.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        temporary.replace(destination)

    def load(self, run_id: str) -> ExperimentSession | None:
        if not RUN_ID.fullmatch(run_id):
            return None
        source = self.runs_root / f"{run_id}.json"
        if not source.exists():
            return None
        payload = json.loads(source.read_text(encoding="utf-8"))
        payload["database_path"] = str(self.memory_root / str(payload["database_path"]))
        return ExperimentSession.from_snapshot(payload)
