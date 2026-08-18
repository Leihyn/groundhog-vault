from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

from .domain import Opportunity, RiskPolicy


class RiskMemory(Protocol):
    def recall(self, opportunity: Opportunity) -> RiskPolicy | None: ...

    def remember_failure(
        self,
        *,
        incident_id: str,
        opportunity: Opportunity,
        loss: float,
    ) -> RiskPolicy | None: ...


class NoMemory:
    def recall(self, opportunity: Opportunity) -> None:
        return None

    def remember_failure(
        self,
        *,
        incident_id: str,
        opportunity: Opportunity,
        loss: float,
    ) -> None:
        return None


class SibylRiskMemory:
    """Risk memory backed by the official local-first Sibyl SDK."""

    def __init__(self, database_path: str | Path):
        try:
            from sibyl_memory_client import MemoryClient
        except ImportError as error:
            raise RuntimeError(
                "sibyl-memory-client is required. Install the project with `.venv/bin/pip install -e .`."
            ) from error

        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._client = MemoryClient.local(str(self.database_path))

    def recall(self, opportunity: Opportunity) -> RiskPolicy | None:
        signature = opportunity.signals.signature()
        if signature is None:
            return None

        try:
            entity = self._client.get_entity("risk_policy", signature)
        except Exception as error:
            if error.__class__.__name__ == "NotFoundError":
                return None
            raise

        body = entity.get("body")
        if not isinstance(body, dict):
            raise TypeError(f"Sibyl returned a non-object policy body for {signature!r}")
        return RiskPolicy.from_body(body)

    def remember_failure(
        self,
        *,
        incident_id: str,
        opportunity: Opportunity,
        loss: float,
    ) -> RiskPolicy | None:
        signature = opportunity.signals.signature()
        if signature is None or loss <= 0:
            return None

        signals = opportunity.signals.labels()
        policy = RiskPolicy(
            policy_id=f"policy:{signature}",
            signature=signature,
            maximum_exposure=0.05,
            confidence=0.86,
            source_incident_id=incident_id,
            lesson=(
                "Cap exposure when incentive-funded yield, concentrated liquidity, "
                "and shallow exits appear together."
            ),
            signals=signals,
        )
        self._client.set_entity("risk_policy", signature, policy.as_body())
        self._client.write_event(
            acted=[
                json.dumps(
                    {
                        "incident_id": incident_id,
                        "protocol": opportunity.protocol_name,
                        "loss": round(loss, 2),
                        "signals": list(signals),
                        "promoted_policy": policy.policy_id,
                    },
                    sort_keys=True,
                )
            ]
        )
        return policy
