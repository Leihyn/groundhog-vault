from __future__ import annotations

from .domain import ArmName, Decision, Opportunity
from .memory import RiskMemory


class VaultAgent:
    """A deliberately small decision policy used to isolate memory causality."""

    def __init__(self, *, arm: ArmName, session_id: str, memory: RiskMemory):
        self.arm = arm
        self.session_id = session_id
        self.memory = memory

    def decide(self, opportunity: Opportunity) -> Decision:
        baseline_allocation = 0.30 if opportunity.advertised_apy >= 0.20 else 0.15
        recalled = self.memory.recall(opportunity)

        if recalled is None:
            return Decision(
                arm=self.arm,
                session_id=self.session_id,
                opportunity_id=opportunity.opportunity_id,
                allocation_fraction=baseline_allocation,
                rationale=(
                    f"No prior policy matches {opportunity.protocol_name}; allocate "
                    f"{baseline_allocation:.0%} based on current yield."
                ),
                recalled_policy_ids=(),
            )

        allocation = min(baseline_allocation, recalled.maximum_exposure)
        return Decision(
            arm=self.arm,
            session_id=self.session_id,
            opportunity_id=opportunity.opportunity_id,
            allocation_fraction=allocation,
            rationale=(
                f"Recalled {recalled.policy_id} from {recalled.source_incident_id}; "
                f"cap exposure at {allocation:.0%}."
            ),
            recalled_policy_ids=(recalled.policy_id,),
        )
