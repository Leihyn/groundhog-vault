from __future__ import annotations

import tempfile
import unittest
from math import nan
from pathlib import Path

from groundhog_vault.agent import VaultAgent
from groundhog_vault.experiment import (
    create_experiment_session,
    result_as_dict,
    run_experiment,
)
from groundhog_vault.memory import NoMemory, SibylRiskMemory
from groundhog_vault.scenarios import DISGUISED_DEPEG_SEQUENCE
from groundhog_vault.storage import ExperimentStore
from groundhog_vault.treasury import TreasuryWorkflow


class GroundhogMemoryTests(unittest.TestCase):
    def test_treasury_rejects_non_finite_numbers(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            workflow = TreasuryWorkflow(Path(directory) / "treasury.db")
            valid_signals = {
                "incentive_funded_yield": 0.85,
                "liquidity_concentration": 0.80,
                "exit_liquidity": 0.20,
                "peg_instability": 0.75,
            }
            with self.assertRaisesRegex(ValueError, "finite"):
                workflow.submit_incident(
                    {
                        "protocol_name": "Invalid Loss",
                        "loss": nan,
                        "advertised_apy": 0.27,
                        "signals": valid_signals,
                    }
                )
            with self.assertRaisesRegex(ValueError, "finite"):
                workflow.evaluate_proposal(
                    {
                        "protocol_name": "Invalid Signal",
                        "advertised_apy": 0.22,
                        "signals": {**valid_signals, "peg_instability": nan},
                    }
                )

    def test_unmatched_risk_signature_does_not_apply_policy(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "treasury.db"
            TreasuryWorkflow(database).submit_incident(
                {
                    "protocol_name": "Known Failure",
                    "loss": 18_000,
                    "advertised_apy": 0.27,
                    "signals": {
                        "incentive_funded_yield": 0.85,
                        "liquidity_concentration": 0.80,
                        "exit_liquidity": 0.20,
                        "peg_instability": 0.75,
                    },
                }
            )
            evaluation = TreasuryWorkflow(database).evaluate_proposal(
                {
                    "protocol_name": "Different Risk",
                    "advertised_apy": 0.22,
                    "signals": {
                        "incentive_funded_yield": 0.20,
                        "liquidity_concentration": 0.20,
                        "exit_liquidity": 0.80,
                        "peg_instability": 0.10,
                    },
                }
            )
            self.assertIsNone(evaluation["recalled_policy"])
            self.assertEqual(evaluation["decision"]["allocation_fraction"], 0.30)

    def test_active_run_survives_store_reconstruction(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            first_process = ExperimentStore(directory)
            session = first_process.create()
            session.run_next_life()
            first_process.save(session)

            second_process = ExperimentStore(directory)
            restored = second_process.load(session.run_id)
            self.assertIsNotNone(restored)
            self.assertEqual(restored.next_life_number, 2)
            self.assertEqual(len(restored.groundhog_lives), 1)

            restored.run_next_life()
            second_process.save(restored)
            final = ExperimentStore(directory).load(session.run_id)
            self.assertTrue(final.complete)
            self.assertEqual(final.snapshot()["memory_lift"], 12_300.0)

    def test_user_incident_changes_a_fresh_treasury_evaluation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "treasury.db"
            signals = {
                "incentive_funded_yield": 0.85,
                "liquidity_concentration": 0.80,
                "exit_liquidity": 0.20,
                "peg_instability": 0.75,
            }
            incident = TreasuryWorkflow(database).submit_incident(
                {
                    "protocol_name": "Northstar USD",
                    "loss": 18_000,
                    "advertised_apy": 0.27,
                    "signals": signals,
                }
            )
            evaluation = TreasuryWorkflow(database).evaluate_proposal(
                {
                    "protocol_name": "Harbor Yield",
                    "advertised_apy": 0.22,
                    "signals": signals,
                }
            )

            self.assertNotEqual(incident["protocol_name"], evaluation["protocol_name"])
            self.assertEqual(evaluation["decision"]["allocation_fraction"], 0.05)
            self.assertEqual(
                evaluation["recalled_policy"]["source_incident_id"],
                incident["incident_id"],
            )

    def test_incremental_api_model_runs_exactly_one_life_at_a_time(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            session = create_experiment_session(
                database_path=Path(directory) / "memory.db",
                run_id="incremental-test",
            )
            self.assertEqual(session.next_life_number, 1)
            self.assertEqual(len(session.snapshot()["groundhog"]["lives"]), 0)

            session.run_next_life()
            life_one = session.snapshot()
            self.assertEqual(life_one["next_life_number"], 2)
            self.assertIsNone(life_one["memory_lift"])
            self.assertEqual(len(life_one["groundhog"]["lives"]), 1)

            session.run_next_life()
            life_two = session.snapshot()
            self.assertTrue(life_two["complete"])
            self.assertEqual(life_two["memory_lift"], 12_300.0)
            self.assertEqual(
                life_two["groundhog"]["lives"][1]["decision"]["allocation_fraction"],
                0.05,
            )

    def test_sibyl_policy_survives_a_fresh_client(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "memory.db"
            first_life = DISGUISED_DEPEG_SEQUENCE[0]
            second_life = DISGUISED_DEPEG_SEQUENCE[1]

            with SibylRiskMemory(database) as first_client:
                policy = first_client.remember_failure(
                    incident_id="incident:test:life-1",
                    opportunity=first_life,
                    loss=18_000.0,
                )
            self.assertIsNotNone(policy)

            with SibylRiskMemory(database) as fresh_client:
                recalled = fresh_client.recall(second_life)
            self.assertIsNotNone(recalled)
            self.assertEqual(recalled.source_incident_id, "incident:test:life-1")
            self.assertEqual(recalled.maximum_exposure, 0.05)

    def test_memory_is_the_only_variable_that_changes_allocation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "memory.db"
            first_life = DISGUISED_DEPEG_SEQUENCE[0]
            second_life = DISGUISED_DEPEG_SEQUENCE[1]
            with SibylRiskMemory(database) as memory:
                memory.remember_failure(
                    incident_id="incident:test:life-1",
                    opportunity=first_life,
                    loss=18_000.0,
                )

            with SibylRiskMemory(database) as memory:
                groundhog = VaultAgent(
                    arm="groundhog",
                    session_id="fresh-groundhog-session",
                    memory=memory,
                ).decide(second_life)
            amnesiac = VaultAgent(
                arm="amnesiac",
                session_id="fresh-amnesiac-session",
                memory=NoMemory(),
            ).decide(second_life)

            self.assertEqual(groundhog.opportunity_id, amnesiac.opportunity_id)
            self.assertEqual(groundhog.allocation_fraction, 0.05)
            self.assertEqual(amnesiac.allocation_fraction, 0.30)
            self.assertTrue(groundhog.recalled_policy_ids)
            self.assertFalse(amnesiac.recalled_policy_ids)

    def test_full_experiment_reconstructs_sessions_and_measures_memory_lift(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = run_experiment(
                database_path=Path(directory) / "memory.db",
                run_id="deterministic-acceptance-test",
            )

            self.assertNotEqual(
                result.groundhog.lives[0].session_id,
                result.groundhog.lives[1].session_id,
            )
            self.assertEqual(
                result.groundhog.lives[1].decision.allocation_fraction, 0.05
            )
            self.assertEqual(
                result.amnesiac.lives[1].decision.allocation_fraction, 0.30
            )
            self.assertEqual(result.groundhog.final_capital, 79_540.0)
            self.assertEqual(result.amnesiac.final_capital, 67_240.0)
            self.assertEqual(result.memory_lift, 12_300.0)
            payload = result_as_dict(result)
            self.assertEqual(payload["memory_lift"], 12_300.0)
            self.assertEqual(
                payload["groundhog"]["lives"][1]["decision"]["allocation_fraction"],
                0.05,
            )


if __name__ == "__main__":
    unittest.main()
