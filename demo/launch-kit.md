# Groundhog Vault launch kit

## Post 1 — memory proof

Building Groundhog Vault for the Sibyl Labs hackathon.

Two treasury agents get the same capital, logic, and market. Both runtimes are destroyed between rounds. Only one can recall the first loss.

Result: 5% vs 30% exposure and $12,300 preserved by memory.

[Demo URL]

## Post 2 — product and Base

Groundhog Vault now accepts a treasury's own incident, converts it into a Sibyl risk policy, and evaluates a differently named proposal in a fresh session.

The user can sign the recommendation as a decision receipt on Base Sepolia. The agent never holds the treasury wallet.

[Demo URL]
[Repository URL]
[Base transaction URL]

## Submission fields

### What breaks when memory is deleted?

Without Sibyl memory, Groundhog cannot recognize a previously harmful risk signature after its runtime is destroyed. It repeats 30% exposure like the control and loses an additional $12,300 in the controlled experiment; the user-supplied treasury review also loses its connection to prior incidents.

### Memory walkthrough

```text
Persist: A loss is written as a Sibyl incident entity and append-only event; its risk signature is promoted into a reusable exposure-cap policy.
Recall (fresh session): A new agent and Sibyl client retrieve the policy by the later proposal's risk signature, even when the protocol name changes.
Changes the agent's decision by: Groundhog cuts exposure from 30% to 5%, preserves $12,300 in the controlled run, and can anchor the recommendation as a user-signed Base Sepolia receipt.
```

### Memory primitives

- Recall
- Entities

## Demo rehearsal

1. State the claim: a treasury should not pay for the same lesson twice.
2. Run Life 1 and point out the identical 30% allocations and losses.
3. Destroy both runtimes and identify Sibyl as the only surviving state.
4. Run Life 2 and show 5% vs 30% plus the $12,300 Memory Lift.
5. Open Evidence and trace incident → policy → fresh decision.
6. Open Treasury, store Northstar USD, and evaluate Harbor Yield.
7. Record the resulting 5% recommendation on Base Sepolia.
8. Close on the production boundary: recommendations are constrained and user-signed; the agent never controls funds.

## Final checks

- [ ] Public demo works in a private browser window.
- [ ] Base receipt contract and one transaction are visible in the explorer.
- [ ] Demo video is public or unlisted and plays without login.
- [ ] Both build posts are public.
- [ ] Repository is public and setup instructions work from a clean clone.
- [ ] Submission fields contain the final URLs.
- [ ] Ready-for-judging is enabled only after every URL is verified.
