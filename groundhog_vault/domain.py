from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Literal

ArmName = Literal["groundhog", "amnesiac"]


@dataclass(frozen=True)
class RiskSignals:
    incentive_funded_yield: float
    liquidity_concentration: float
    exit_liquidity: float
    peg_instability: float

    def signature(self) -> str | None:
        high_risk = (
            self.incentive_funded_yield >= 0.60
            and self.liquidity_concentration >= 0.60
            and self.exit_liquidity <= 0.40
        )
        return (
            "incentive-yield_concentrated-liquidity_shallow-exit" if high_risk else None
        )

    def labels(self) -> tuple[str, ...]:
        labels: list[str] = []
        if self.incentive_funded_yield >= 0.60:
            labels.append("incentive-funded yield")
        if self.liquidity_concentration >= 0.60:
            labels.append("concentrated liquidity")
        if self.exit_liquidity <= 0.40:
            labels.append("shallow exit liquidity")
        if self.peg_instability >= 0.40:
            labels.append("peg instability")
        return tuple(labels)


@dataclass(frozen=True)
class Opportunity:
    opportunity_id: str
    protocol_name: str
    advertised_apy: float
    signals: RiskSignals
    loss_fraction_if_crisis: float


@dataclass(frozen=True)
class RiskPolicy:
    policy_id: str
    signature: str
    maximum_exposure: float
    confidence: float
    source_incident_id: str
    lesson: str
    signals: tuple[str, ...]

    def as_body(self) -> dict[str, Any]:
        body = asdict(self)
        body["signals"] = list(self.signals)
        return body

    @classmethod
    def from_body(cls, body: dict[str, Any]) -> RiskPolicy:
        return cls(
            policy_id=str(body["policy_id"]),
            signature=str(body["signature"]),
            maximum_exposure=float(body["maximum_exposure"]),
            confidence=float(body["confidence"]),
            source_incident_id=str(body["source_incident_id"]),
            lesson=str(body["lesson"]),
            signals=tuple(str(value) for value in body["signals"]),
        )


@dataclass(frozen=True)
class Decision:
    arm: ArmName
    session_id: str
    opportunity_id: str
    allocation_fraction: float
    rationale: str
    recalled_policy_ids: tuple[str, ...]


@dataclass(frozen=True)
class LifeResult:
    life_number: int
    arm: ArmName
    session_id: str
    protocol_name: str
    starting_capital: float
    ending_capital: float
    loss: float
    decision: Decision
    incident_id: str


@dataclass(frozen=True)
class ArmResult:
    arm: ArmName
    lives: tuple[LifeResult, ...]

    @property
    def final_capital(self) -> float:
        return self.lives[-1].ending_capital


@dataclass(frozen=True)
class ExperimentResult:
    run_id: str
    database_path: str
    groundhog: ArmResult
    amnesiac: ArmResult

    @property
    def memory_lift(self) -> float:
        return self.groundhog.final_capital - self.amnesiac.final_capital
