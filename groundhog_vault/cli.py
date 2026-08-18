from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path

from .domain import ArmResult, ExperimentResult
from .experiment import result_as_dict, run_experiment


def _money(value: float) -> str:
    return f"${value:,.2f}"


def _print_arm(result: ArmResult) -> None:
    print(f"\n{result.arm.upper()}")
    print("-" * len(result.arm))
    for life in result.lives:
        memory = ", ".join(life.decision.recalled_policy_ids) or "none"
        print(
            f"Life {life.life_number} / {life.protocol_name}: "
            f"allocated {life.decision.allocation_fraction:.0%}, "
            f"lost {_money(life.loss)}, ended with {_money(life.ending_capital)}"
        )
        print(f"  Session: {life.session_id}")
        print(f"  Recalled: {memory}")
        print(f"  Why: {life.decision.rationale}")


def _print_report(result: ExperimentResult) -> None:
    print("GROUNDHOG VAULT — FRESH-SESSION MEMORY TEST")
    print(f"Run: {result.run_id}")
    print(f"Sibyl database: {result.database_path}")
    _print_arm(result.groundhog)
    _print_arm(result.amnesiac)
    print("\nRESULT")
    print("------")
    print(f"Groundhog final capital: {_money(result.groundhog.final_capital)}")
    print(f"Amnesiac final capital:  {_money(result.amnesiac.final_capital)}")
    print(f"Memory lift:             +{_money(result.memory_lift)}")
    changed = result.groundhog.lives[1].decision.allocation_fraction != result.amnesiac.lives[1].decision.allocation_fraction
    print(f"Decision changed by persisted memory: {'YES' if changed else 'NO'}")


def _default_database_path() -> Path:
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    return Path(".data") / f"groundhog-{stamp}.db"


def main() -> None:
    parser = argparse.ArgumentParser(prog="groundhog")
    subparsers = parser.add_subparsers(dest="command", required=True)
    demo = subparsers.add_parser("demo", help="run the paired fresh-session experiment")
    demo.add_argument("--database", type=Path, default=None)
    demo.add_argument("--json", action="store_true", help="emit machine-readable output")
    args = parser.parse_args()

    if args.command == "demo":
        database_path = args.database or _default_database_path()
        result = run_experiment(database_path=database_path)
        if args.json:
            print(json.dumps(result_as_dict(result), indent=2))
        else:
            _print_report(result)


if __name__ == "__main__":
    main()
