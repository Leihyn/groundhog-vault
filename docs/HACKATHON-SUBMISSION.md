# Sibyl Labs Hackathon Submission

## Public repo URL

`[Add the public GitHub repository URL after publishing]`

Suggested format: `https://github.com/<username>/groundhog-vault`

## Demo video URL

`[Add the YouTube, Loom, or X video URL after publishing]`

## Build-in-public post URLs

Add at least two public X or Farcaster post URLs, one per line:

```text
[Post 1 URL]
[Post 2 URL]
```

## What breaks when memory is deleted?

Without memory, Groundhog Vault cannot recognize a previously harmful risk signature after its runtime is destroyed, so it repeats the same 30% exposure as the control agent. The treasury guardian becomes an amnesiac allocator and loses an additional $12,300 in our controlled two-life experiment.

## Memory walkthrough

```text
Persist: Each loss is stored as an immutable incident event, and its risk signature is promoted into a Sibyl entity containing a reusable 5% exposure-cap policy and source-incident reference.
Recall (fresh session): Life 2 constructs a new agent and a new Sibyl client, which retrieves the policy by the opportunity's underlying risk signature—not its changed protocol name.
Changes the agent's decision by: Groundhog cuts allocation from 30% to 5% while the memory-disabled control repeats 30%, preserving $12,300 more capital.
```

## Memory primitives used

Select only:

- [x] recall
- [x] entities
- [ ] semantic search
- [ ] temporal / time-travel
- [ ] summarization
- [ ] reflection
- [ ] consolidation

The current implementation directly uses Sibyl entity storage and retrieval plus an incident event journal. Do not select the other primitives unless they are implemented before submission.

## Ready for judging

Leave **Mark ready for judging** unchecked until all of these are complete:

- The repository is public and its URL is saved.
- The demo video is publicly accessible and its URL is saved.
- At least two build-in-public post URLs are saved.
- The submitted commit runs from the README instructions.
