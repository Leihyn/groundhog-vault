from __future__ import annotations

from dataclasses import asdict
from math import isfinite
from pathlib import Path
from typing import Any
from uuid import uuid4

from .agent import VaultAgent
from .domain import Opportunity, RiskSignals
from .memory import SibylRiskMemory


def _signals(raw: dict[str, Any]) -> RiskSignals:
    values = {
        "incentive_funded_yield": float(raw["incentive_funded_yield"]),
        "liquidity_concentration": float(raw["liquidity_concentration"]),
        "exit_liquidity": float(raw["exit_liquidity"]),
        "peg_instability": float(raw["peg_instability"]),
    }
    if any(not isfinite(value) or value < 0 or value > 1 for value in values.values()):
        raise ValueError("risk signals must be finite values between 0 and 1")
    return RiskSignals(**values)


def _required_text(raw: dict[str, Any], field: str) -> str:
    value = str(raw.get(field, "")).strip()
    if not value or len(value) > 80:
        raise ValueError(f"{field} must contain 1 to 80 characters")
    return value


def _finite_number(raw: dict[str, Any], field: str) -> float:
    value = float(raw[field])
    if not isfinite(value):
        raise ValueError(f"{field} must be a finite number")
    return value


class TreasuryWorkflow:
    """User-supplied incidents and fresh-session proposal evaluation."""

    def __init__(self, database_path: str | Path):
        self.database_path = Path(database_path)

    def submit_incident(self, raw: dict[str, Any]) -> dict[str, object]:
        protocol_name = _required_text(raw, "protocol_name")
        loss = _finite_number(raw, "loss")
        advertised_apy = _finite_number(raw, "advertised_apy")
        if loss <= 0:
            raise ValueError("loss must be greater than zero")
        if advertised_apy < 0 or advertised_apy > 5:
            raise ValueError("advertised_apy must be between 0 and 5")

        incident_uuid = uuid4().hex
        incident_id = f"incident:user:{incident_uuid}"
        opportunity = Opportunity(
            opportunity_id=f"incident-opportunity:{incident_uuid}",
            protocol_name=protocol_name,
            advertised_apy=advertised_apy,
            signals=_signals(raw["signals"]),
            loss_fraction_if_crisis=0,
        )
        with SibylRiskMemory(self.database_path) as memory:
            policy = memory.remember_failure(
                incident_id=incident_id,
                opportunity=opportunity,
                loss=loss,
            )
        if policy is None:
            raise ValueError(
                "the submitted signals do not form a supported risk signature"
            )
        return {
            "incident_id": incident_id,
            "protocol_name": protocol_name,
            "loss": loss,
            "risk_signature": policy.signature,
            "policy": policy.as_body(),
        }

    def evaluate_proposal(self, raw: dict[str, Any]) -> dict[str, object]:
        protocol_name = _required_text(raw, "protocol_name")
        advertised_apy = _finite_number(raw, "advertised_apy")
        if advertised_apy < 0 or advertised_apy > 5:
            raise ValueError("advertised_apy must be between 0 and 5")

        evaluation_id = uuid4().hex
        opportunity = Opportunity(
            opportunity_id=f"proposal:{evaluation_id}",
            protocol_name=protocol_name,
            advertised_apy=advertised_apy,
            signals=_signals(raw["signals"]),
            loss_fraction_if_crisis=0,
        )
        with SibylRiskMemory(self.database_path) as memory:
            session_id = f"treasury-review-{uuid4().hex[:12]}"
            decision = VaultAgent(
                arm="groundhog",
                session_id=session_id,
                memory=memory,
            ).decide(opportunity)
            policy = memory.recall(opportunity)
            payload: dict[str, object] = {
                "evaluation_id": evaluation_id,
                "session_id": session_id,
                "protocol_name": protocol_name,
                "advertised_apy": advertised_apy,
                "risk_signature": opportunity.signals.signature(),
                "decision": asdict(decision),
                "recalled_policy": policy.as_body() if policy else None,
            }
            memory.record_evaluation(evaluation_id, payload)
        return payload
