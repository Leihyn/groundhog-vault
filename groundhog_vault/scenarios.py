from .domain import Opportunity, RiskSignals


DISGUISED_DEPEG_SEQUENCE = (
    Opportunity(
        opportunity_id="life-1-moon-pool",
        protocol_name="MoonPool",
        advertised_apy=0.27,
        signals=RiskSignals(
            incentive_funded_yield=0.91,
            liquidity_concentration=0.82,
            exit_liquidity=0.28,
            peg_instability=0.48,
        ),
        loss_fraction_if_crisis=0.60,
    ),
    Opportunity(
        opportunity_id="life-2-sun-pool",
        protocol_name="SunPool",
        advertised_apy=0.22,
        signals=RiskSignals(
            incentive_funded_yield=0.84,
            liquidity_concentration=0.74,
            exit_liquidity=0.34,
            peg_instability=0.43,
        ),
        loss_fraction_if_crisis=0.60,
    ),
)
