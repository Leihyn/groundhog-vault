# Groundhog Vault

Groundhog Vault tests a simple claim: a treasury agent should not pay for the same failure twice.

Two agents receive the same capital, decision logic, market inputs, and deterministic outcomes. Both runtimes are rebuilt between rounds. Groundhog can read a persisted Sibyl risk policy; Amnesiac cannot.

In round one, both allocate 30% to a pool that later depegs. Groundhog records the incident and stores a 5% exposure cap for that risk signature. In round two, a differently named pool presents the same signature. Groundhog recalls the cap; Amnesiac repeats the 30% allocation.

The result is a $12,300 capital difference caused by memory access.

## Run it

Requires Python 3.11 or newer.

```bash
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/python -m groundhog_vault.server --port 4173
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

For terminal output instead:

```bash
.venv/bin/python -m groundhog_vault.cli demo
```

## Why memory is load-bearing

Each round constructs a new `VaultAgent` and a new Sibyl client. The SQLite database is the only state shared across Groundhog sessions. If that memory channel is replaced with `NoMemory`, Groundhog makes the same decision as the control and the capital advantage disappears.

Run metadata is written atomically under `.data/runs/`. An interrupted experiment can therefore be loaded and completed after the server process restarts.

Sibyl stores two records:

- an incident event describing the loss and observed signals;
- a risk-policy entity keyed by the combined signal signature.

The second session retrieves the policy by signature, not protocol name.

## Test

```bash
.venv/bin/python -m unittest discover -s tests -v
```

The tests cover incremental round execution, fresh-client persistence, decision causality, and the final capital difference.

The **Treasury** view also accepts a user-supplied loss and evaluates a later proposal in a genuinely fresh session. This workflow uses the same persisted Sibyl policy path as the controlled experiment.

## Base Sepolia receipts

`contracts/src/RiskReceiptRegistry.sol` records a proposal evaluation ID, recommended allocation, memory-applied flag, and hashes linking the policy to its source incident. The user signs the receipt from the browser; Groundhog never holds the wallet key.

Run the contract tests:

```bash
cd contracts
forge test
```

Deploy with a funded Foundry keystore account:

```bash
forge create src/RiskReceiptRegistry.sol:RiskReceiptRegistry \
  --rpc-url https://sepolia.base.org \
  --account deployer
```

Set `BASE_RECEIPT_CONTRACT` to the deployed address before starting the server. The Treasury view will then let users write decision receipts to Base Sepolia.

For a first deployment, leave the variable unset and choose **Deploy receipt contract** in the Treasury view. The connected wallet deploys the same compiled contract and the browser retains its address. Set `BASE_RECEIPT_CONTRACT` on the hosted service afterward so every visitor uses that registry.

## Scope

The allocation engine is deterministic and never moves treasury funds. Base integration is limited to user-signed decision receipts on Sepolia. The intended deployment path is a constrained treasury recommender whose proposals require contract limits and human approval.

See [docs/PRD.md](docs/PRD.md) for the product boundary.
