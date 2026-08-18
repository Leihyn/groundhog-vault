# State Design: Groundhog Vault

## UX architecture

**Entry:** The judge lands in the arena with two funded vaults and a single primary action: `Run Life 1`.

**Exit:** The judge sees a quantified Memory Lift after Life 2 and can inspect the exact persisted policy that changed Groundhog's decision.

## Screens

1. **Arena** — Runs the paired experiment and compares capital, allocation, and survival.
2. **Memory Evidence** — Shows the incident-to-policy chain and its Sibyl provenance.
3. **Production Mapping** — Translates the arena into a constrained DAO treasury workflow.

## Happy path

Arena ready → Run Life 1 → Watch both fail → Inspect formed memory → Reset sessions → Run Life 2 → Observe decision divergence → Inspect Memory Lift → View production mapping.

## Application states

### Arena phase

- `ready`: Both vaults funded; no session active.
- `deciding`: Fresh agents evaluate the current opportunity.
- `executing`: Typed allocations are applied.
- `crisis`: Deterministic loss event settles.
- `remembering`: Groundhog writes an incident and policy to Sibyl.
- `resetting`: Runtime identities are destroyed and recreated.
- `complete`: Memory Lift and evidence are available.

### Data states

- `empty`: No run exists; explain the experiment and offer `Run Life 1`.
- `loading`: Scenario and memory retrieval are pending; show bounded progress, not an indefinite spinner.
- `error`: Name the failed subsystem and offer `Retry life` without destroying the previous evidence.
- `success`: Show decisions, capital, cited memory, and Base evidence where available.

## Core entities

- `Run`: experiment identifier and deterministic seed.
- `Life`: scenario, agent session IDs, and outcome.
- `VaultArm`: Groundhog or Amnesiac, capital, allocation, and status.
- `Opportunity`: market terms and normalized risk signals.
- `Decision`: allocation, rationale, and cited policy IDs.
- `Incident`: observed loss and causal signals.
- `RiskPolicy`: risk signature, exposure cap, confidence, and provenance.

## State ownership

- Scenario engine owns deterministic market truth.
- Each fresh agent session owns only its current prompt and decision.
- Sibyl owns Groundhog's cross-session memory.
- The Base contract will own executable balances and immutable epoch events.
- The interface derives presentation state from the event stream.

## Kill-switch test

- The first-time user has one primary action per phase.
- The comparison is visible without opening the memory inspector.
- Removing Sibyl makes Groundhog converge to Amnesiac behavior.
- The production story is one translation screen, not a second application.
