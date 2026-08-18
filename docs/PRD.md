# Groundhog Vault: Product Requirements

## Problem

Treasury agents are often stateless between sessions. A new session can repeat an earlier loss even when the organization already paid to learn the lesson.

Groundhog Vault turns a loss into a persisted risk policy and measures whether that policy changes a later decision.

## Demonstration

Two agents begin with $100,000 and receive identical decision logic and market inputs.

1. Both allocate 30% to MoonPool.
2. A deterministic depeg reduces both balances to $82,000.
3. Groundhog stores the incident and a 5% exposure cap in Sibyl.
4. Both agent runtimes are discarded.
5. Fresh agents evaluate SunPool, which has a new name but the same risk signature.
6. Groundhog retrieves the cap and allocates 5%; Amnesiac allocates 30%.
7. Groundhog finishes with $12,300 more capital.

Memory is the only experimental variable.

## Requirements

- Construct a new agent and memory client for each round.
- Persist Groundhog's records in an on-disk Sibyl database.
- Give the control arm no cross-session history.
- Match policies by risk signature rather than protocol name.
- Link each policy to its source incident.
- Expose each round through a separate API request.
- Show capital, allocation, runtime identity, rationale, and recalled policy.
- Keep the result deterministic and covered by tests.

## Memory records

### Incident event

An append-only record containing the protocol, loss, observed signals, and promoted policy identifier.

### Risk-policy entity

The current exposure rule for a signal signature, including its cap, confidence, lesson, and source incident.

## Production boundary

The current build is a simulation. A deployed treasury guardian would produce constrained transaction proposals rather than execute unrestricted model output.

Required safeguards:

- allowlisted assets and protocols;
- exposure and slippage limits enforced by contracts;
- evidence attached to every recommendation;
- human or multisig approval for consequential actions;
- expiry and review rules for learned policies.

## Not in the current build

- Mainnet funds
- Live protocol integrations
- Price prediction
- Base contracts
- Virtuals coordination
- Model-generated transactions
