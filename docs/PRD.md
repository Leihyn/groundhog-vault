# Groundhog Vault — Product Requirements

## Product thesis

DeFi systems can monitor what is happening now, but their operators and agents can still repeat structurally similar failures across sessions. Groundhog Vault turns incidents into persistent, inspectable risk policies and proves their effect in a controlled time-loop arena.

**Hackathon experience:** a vault repeatedly faces DeFi crises and becomes harder to kill.

**Production direction:** institutional risk memory for DAO treasuries and constrained autonomous vault guardians.

## Primary demonstration

Two identical vaults receive the same capital, market state, actions, and deterministic outcomes. Both runtimes are reconstructed between lives. The only experimental variable is whether Sibyl recall is enabled.

1. In Life 1, both vaults allocate 30% to a high-yield pool and suffer a stablecoin depeg.
2. Groundhog writes the incident to Sibyl's COLD journal and promotes a reusable risk policy to a WARM entity.
3. Both agent instances are discarded.
4. In Life 2, a differently named pool presents the same causal risk signature.
5. A fresh Groundhog instance recalls the policy and caps exposure at 5%.
6. A fresh Amnesiac instance repeats the 30% allocation.
7. The runner reports capital preserved and whether memory changed the decision.

## Users

### Hackathon user

A judge or spectator who needs to understand the value of persistent memory in under sixty seconds.

### Production user

A DAO treasury committee, protocol risk team, or onchain asset manager that needs prior incidents to influence new proposals while retaining deterministic execution limits and human approval.

## Functional requirements

### P0 — Load-bearing memory proof

- Deterministic, seedable scenarios.
- Groundhog and Amnesiac control arms.
- New agent object for every life.
- Persistent Sibyl database shared only by Groundhog sessions.
- Structured incident, lesson, policy, and decision records.
- Provenance from policy to source incident.
- Machine-readable and human-readable reports.
- Tests showing the same current input produces different decisions only when memory is available.

### P1 — Judge-facing product

- Visual crash-and-rewind sequence.
- Side-by-side vault capital and decisions.
- Inspectable memories with source and confidence.
- Base Sepolia transaction evidence.
- A destructive "erase memory" control with confirmation.

### P2 — Partner integrations

- A constrained Base vault executes approved scenario allocations and records epoch results.
- A Virtuals ACP counterparty proposes economically meaningful terms that Groundhog may accept, reject, or renegotiate based on memory.

## Non-goals

- Mainnet funds.
- Price prediction or guaranteed returns.
- Unrestricted model-generated transactions.
- A general portfolio optimizer.
- A token launch.
- Exhaustive simulation of real protocols.

## Memory model

| Artifact | Sibyl tier | Purpose |
|---|---|---|
| Current life | HOT state | Active capital, scenario, and phase |
| Risk policy | WARM entity | One current policy per causal risk signature |
| Incident | COLD journal | Append-only account of what happened |
| Scenario definition | REFERENCE | Static facts and deterministic rules |
| Retired policy | ARCHIVE | Superseded rule retained for audit |

The initial implementation uses WARM entities and COLD journal entries. HOT and REFERENCE wiring follows when the live orchestrator is added.

## Safety model

- The reasoning layer chooses only from a typed action schema.
- Smart contracts enforce asset, protocol, exposure, and slippage limits.
- Consequential production actions remain multisig proposals.
- Every recommendation cites the memory records that affected it.
- Memories carry confidence, evidence, creation time, and eventual expiry.

## Success metrics

- **Memory lift:** Groundhog final capital minus Amnesiac final capital.
- **Repeat-loss rate:** percentage of previously observed risk signatures repeated.
- **Lives survived:** epochs completed above the insolvency threshold.
- **Decision influence:** count of decisions changed by a cited memory.
- **False-positive avoidance:** safe opportunities rejected because of an over-broad lesson.

## Definition of done for the first milestone

- A single command runs both control arms through two fresh sessions.
- Groundhog uses the official `sibyl-memory-client` package.
- Groundhog allocates no more than 5% in the disguised-repeat scenario.
- Amnesiac allocates 30% in the same scenario.
- The result is deterministic and covered by tests.
