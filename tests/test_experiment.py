from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from groundhog_vault.agent import VaultAgent
from groundhog_vault.experiment import create_experiment_session, result_as_dict, run_experiment
from groundhog_vault.memory import NoMemory, SibylRiskMemory
from groundhog_vault.scenarios import DISGUISED_DEPEG_SEQUENCE


class GroundhogMemoryTests(unittest.TestCase):
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
            self.assertEqual(life_two["groundhog"]["lives"][1]["decision"]["allocation_fraction"], 0.05)

    def test_sibyl_policy_survives_a_fresh_client(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "memory.db"
            first_life = DISGUISED_DEPEG_SEQUENCE[0]
            second_life = DISGUISED_DEPEG_SEQUENCE[1]

            first_client = SibylRiskMemory(database)
            policy = first_client.remember_failure(
                incident_id="incident:test:life-1",
                opportunity=first_life,
                loss=18_000.0,
            )
            self.assertIsNotNone(policy)

            fresh_client = SibylRiskMemory(database)
            recalled = fresh_client.recall(second_life)
            self.assertIsNotNone(recalled)
            self.assertEqual(recalled.source_incident_id, "incident:test:life-1")
            self.assertEqual(recalled.maximum_exposure, 0.05)

    def test_memory_is_the_only_variable_that_changes_allocation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "memory.db"
            first_life = DISGUISED_DEPEG_SEQUENCE[0]
            second_life = DISGUISED_DEPEG_SEQUENCE[1]
            SibylRiskMemory(database).remember_failure(
                incident_id="incident:test:life-1",
                opportunity=first_life,
                loss=18_000.0,
            )

            groundhog = VaultAgent(
                arm="groundhog",
                session_id="fresh-groundhog-session",
                memory=SibylRiskMemory(database),
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

    def test_full_experiment_reconstructs_sessions_and_measures_memory_lift(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = run_experiment(
                database_path=Path(directory) / "memory.db",
                run_id="deterministic-acceptance-test",
            )

            self.assertNotEqual(
                result.groundhog.lives[0].session_id,
                result.groundhog.lives[1].session_id,
            )
            self.assertEqual(result.groundhog.lives[1].decision.allocation_fraction, 0.05)
            self.assertEqual(result.amnesiac.lives[1].decision.allocation_fraction, 0.30)
            self.assertEqual(result.groundhog.final_capital, 79_540.0)
            self.assertEqual(result.amnesiac.final_capital, 67_240.0)
            self.assertEqual(result.memory_lift, 12_300.0)
            payload = result_as_dict(result)
            self.assertEqual(payload["memory_lift"], 12_300.0)
            self.assertEqual(payload["groundhog"]["lives"][1]["decision"]["allocation_fraction"], 0.05)


if __name__ == "__main__":
    unittest.main()
