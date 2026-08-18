from __future__ import annotations

from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path
from uuid import uuid4

from .agent import VaultAgent
from .domain import ArmName, ArmResult, Decision, ExperimentResult, LifeResult
from .memory import NoMemory, RiskMemory, SibylRiskMemory
from .scenarios import DISGUISED_DEPEG_SEQUENCE

MemoryFactory = Callable[[], RiskMemory]


def _run_life(
    *,
    arm: ArmName,
    life_number: int,
    starting_capital: float,
    memory_factory: MemoryFactory,
) -> LifeResult:
    opportunity = DISGUISED_DEPEG_SEQUENCE[life_number - 1]
    session_id = f"{arm}-life-{life_number}-{uuid4().hex[:8]}"

    # This object is intentionally reconstructed for every life. No agent
    # state survives except what the memory provider persisted externally.
    memory = memory_factory()
    try:
        agent = VaultAgent(arm=arm, session_id=session_id, memory=memory)
        decision = agent.decide(opportunity)

        amount_at_risk = starting_capital * decision.allocation_fraction
        loss = amount_at_risk * opportunity.loss_fraction_if_crisis
        ending_capital = starting_capital - loss
        incident_id = f"incident:{arm}:life-{life_number}:{opportunity.opportunity_id}"

        memory.remember_failure(
            incident_id=incident_id,
            opportunity=opportunity,
            loss=loss,
        )
    finally:
        memory.close()
    return LifeResult(
        life_number=life_number,
        arm=arm,
        session_id=session_id,
        protocol_name=opportunity.protocol_name,
        starting_capital=starting_capital,
        ending_capital=ending_capital,
        loss=loss,
        decision=decision,
        incident_id=incident_id,
    )


@dataclass
class ExperimentSession:
    """Incremental paired experiment with an explicit fresh-session boundary."""

    run_id: str
    database_path: Path
    groundhog_lives: list[LifeResult] = field(default_factory=list)
    amnesiac_lives: list[LifeResult] = field(default_factory=list)

    @property
    def next_life_number(self) -> int | None:
        next_number = len(self.groundhog_lives) + 1
        return next_number if next_number <= len(DISGUISED_DEPEG_SEQUENCE) else None

    @property
    def complete(self) -> bool:
        return self.next_life_number is None

    def run_next_life(self) -> tuple[LifeResult, LifeResult]:
        life_number = self.next_life_number
        if life_number is None:
            raise RuntimeError("experiment is already complete")

        groundhog_capital = (
            self.groundhog_lives[-1].ending_capital
            if self.groundhog_lives
            else 100_000.0
        )
        amnesiac_capital = (
            self.amnesiac_lives[-1].ending_capital if self.amnesiac_lives else 100_000.0
        )
        groundhog_life = _run_life(
            arm="groundhog",
            life_number=life_number,
            starting_capital=groundhog_capital,
            memory_factory=lambda: SibylRiskMemory(self.database_path),
        )
        amnesiac_life = _run_life(
            arm="amnesiac",
            life_number=life_number,
            starting_capital=amnesiac_capital,
            memory_factory=NoMemory,
        )
        self.groundhog_lives.append(groundhog_life)
        self.amnesiac_lives.append(amnesiac_life)
        return groundhog_life, amnesiac_life

    def snapshot(self) -> dict[str, object]:
        memory_lift = None
        if self.complete:
            memory_lift = (
                self.groundhog_lives[-1].ending_capital
                - self.amnesiac_lives[-1].ending_capital
            )
        return {
            "run_id": self.run_id,
            "database_path": str(self.database_path),
            "next_life_number": self.next_life_number,
            "complete": self.complete,
            "groundhog": asdict(
                ArmResult(arm="groundhog", lives=tuple(self.groundhog_lives))
            ),
            "amnesiac": asdict(
                ArmResult(arm="amnesiac", lives=tuple(self.amnesiac_lives))
            ),
            "memory_lift": memory_lift,
        }

    @classmethod
    def from_snapshot(cls, payload: dict[str, object]) -> ExperimentSession:
        def restore_life(raw: dict[str, object]) -> LifeResult:
            decision_raw = raw["decision"]
            if not isinstance(decision_raw, dict):
                raise TypeError("decision must be an object")
            decision = Decision(
                arm=str(decision_raw["arm"]),
                session_id=str(decision_raw["session_id"]),
                opportunity_id=str(decision_raw["opportunity_id"]),
                allocation_fraction=float(decision_raw["allocation_fraction"]),
                rationale=str(decision_raw["rationale"]),
                recalled_policy_ids=tuple(
                    str(value) for value in decision_raw["recalled_policy_ids"]
                ),
            )
            return LifeResult(
                life_number=int(raw["life_number"]),
                arm=str(raw["arm"]),
                session_id=str(raw["session_id"]),
                protocol_name=str(raw["protocol_name"]),
                starting_capital=float(raw["starting_capital"]),
                ending_capital=float(raw["ending_capital"]),
                loss=float(raw["loss"]),
                decision=decision,
                incident_id=str(raw["incident_id"]),
            )

        def restore_arm(name: ArmName) -> list[LifeResult]:
            raw_arm = payload[name]
            if not isinstance(raw_arm, dict) or not isinstance(
                raw_arm.get("lives"), list
            ):
                raise TypeError(f"{name} arm is invalid")
            return [restore_life(raw) for raw in raw_arm["lives"]]

        return cls(
            run_id=str(payload["run_id"]),
            database_path=Path(str(payload["database_path"])),
            groundhog_lives=restore_arm("groundhog"),
            amnesiac_lives=restore_arm("amnesiac"),
        )


def create_experiment_session(
    *, database_path: str | Path, run_id: str | None = None
) -> ExperimentSession:
    return ExperimentSession(
        run_id=run_id or uuid4().hex,
        database_path=Path(database_path),
    )


def run_experiment(
    *, database_path: str | Path, run_id: str | None = None
) -> ExperimentResult:
    session = create_experiment_session(database_path=database_path, run_id=run_id)
    while not session.complete:
        session.run_next_life()
    return ExperimentResult(
        run_id=session.run_id,
        database_path=str(session.database_path),
        groundhog=ArmResult(arm="groundhog", lives=tuple(session.groundhog_lives)),
        amnesiac=ArmResult(arm="amnesiac", lives=tuple(session.amnesiac_lives)),
    )


def result_as_dict(result: ExperimentResult) -> dict[str, object]:
    payload = asdict(result)
    payload["memory_lift"] = result.memory_lift
    return payload
