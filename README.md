# Groundhog Vault

Every crash resets the market. Only the vault remembers.

Groundhog Vault is a controlled DeFi risk arena built to prove that persistent memory changes an autonomous treasury's decisions across genuinely fresh sessions. Two identical vaults face the same sequence of market opportunities:

- **Groundhog** recalls risk policies stored in Sibyl Memory.
- **Amnesiac** starts every life without history.

The first vertical slice covers a disguised-repeat stablecoin depeg. Both vaults lose in the first life. In the second life, the opportunity has a different name but the same risk signature. Groundhog limits its exposure because it recalls the previous failure; Amnesiac repeats it.

## Run the proof

```bash
cd groundhog-vault
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/python -m groundhog_vault.cli demo
```

The demo creates a new Sibyl SQLite database for every run under `.data/`. The agent object is reconstructed for each life; the database is the only state that crosses the session boundary.

Run the tests:

```bash
.venv/bin/python -m unittest discover -s tests -v
```

Run the judge-facing interface:

```bash
.venv/bin/python -m groundhog_vault.server --port 4173
```

Then open `http://127.0.0.1:4173`. The interface creates an empty experiment, runs Life 1, destroys both agent runtimes, and runs Life 2 through separate API calls. This makes the visible timeline match the actual execution timeline.

## Current scope

Status labels are intentionally explicit:

- `WIRED`: deterministic scenario engine, incremental A/B runner, Sibyl WARM policies, Sibyl COLD incident journal, and judge-facing production interface.
- `TESTED`: one-life-at-a-time API chronology, fresh-client recall, decision divergence, memory causality, and UI rule audit.
- `PROPOSED`: model-backed reasoning, Base Sepolia vault, and Virtuals ACP counterparty.

See [the PRD](docs/PRD.md) for the product boundary and acceptance criteria.

## Interface

The production interface in [`web/`](web/) combines the strongest parts of two explored directions: Proposal 1's cinematic session reset and Proposal 2's evidence-led institutional risk desk.

The three original interactive directions remain available for design provenance:

1. [Time-loop terminal](proposals/proposal-1.html) — immersive, asymmetric, and theatrical.
2. [Institutional risk desk](proposals/proposal-2.html) — evidence-dense and closest to the production treasury story.
3. [Market crash arena](proposals/proposal-3.html) — full-bleed, energetic, and strongest for a live audience.

Open [the proposal catalogue](proposals/index.html) to compare them.
