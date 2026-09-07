# Groundhog Vault: Sibyl hackathon submission fields

Paste each block into the matching field on the build page.

## Public repo URL

```
https://github.com/Leihyn/groundhog-vault
```

## Demo video URL

Upload `demo/groundhog-vault-demo.mp4` (2 min 25 s, 1080p, captions burned in) to YouTube as unlisted or to Loom, then paste the link here.

Captions are burned into the picture, so they work on any player. `demo/captions.srt` is the same text as a
subtitle track: on YouTube, open Subtitles, add a track, and upload that file so the video is searchable and
screen-reader friendly.

Suggested YouTube title: **Groundhog Vault: proving agent memory changes a treasury decision**

Suggested description:

```
Two treasury agents get the same capital, the same decision logic, and the same market. Both runtimes are
destroyed between rounds. Only one can read a persisted Sibyl risk policy.

In round one both allocate 30% to MoonPool and lose $18,000. In round two SunPool has a different name but
the same risk signature. Groundhog recalls the policy and caps exposure at 5%. Amnesiac repeats 30%.
Memory alone preserves $12,300.

The recommendation is signed by the user as a decision receipt on Base Sepolia. The agent never holds the wallet.

Code: https://github.com/Leihyn/groundhog-vault
Receipt: https://base-sepolia.blockscout.com/tx/0x532481c39d68fedb7d102407ee819cc19478bcd02ee7bc614ffb8508ad66e0e9
Built for the Sibyl hackathon.
```

```
[VIDEO URL]
```

## Post URLs (one per line)

```
https://farcaster.xyz/leihyn/0x7ce45779
https://farcaster.xyz/leihyn/0x3043ab12
```

## What breaks when memory is deleted?

```
Without Sibyl memory, a fresh Groundhog session cannot recognise a risk signature the treasury already paid to learn. It repeats the control's 30% exposure and loses a further $12,300 in the controlled run, and the treasury review loses its link to prior incidents.
```

## Memory walkthrough

```
Persist: A loss is written as a Sibyl risk_incident entity plus an append-only event, and its signal signature is promoted into a risk_policy entity holding a 5% exposure cap, confidence, lesson, and source incident ID.
Recall (fresh session): A new VaultAgent and a new Sibyl MemoryClient look up risk_policy by the later proposal's signature, so the cap is found even though the protocol name changed from MoonPool to SunPool.
Changes the agent's decision by: Groundhog cuts exposure from 30% to 5%, finishes $12,300 ahead of the memory-less control, and the recommendation is anchored as a user-signed decision receipt on Base Sepolia (tx 0x532481…e0e9).
```

## Memory primitives used

- recall
- entities

Leave semantic search, temporal, summarization, reflection, and consolidation unticked. The code does keyed entity lookups only.

## Supporting links (not form fields)

- Registry contract on Base Sepolia: https://sepolia-explorer.base.org/address/0x980ea2442f51f39f7d0b257ec8c3449e630434f4
- Contract creation tx: https://sepolia-explorer.base.org/tx/0x7395ab0be57dcdb56c6fabe7cf314cc38b5295493a9f44a2e48dd5a4ed8e8f4a
- Verified decision receipt (5%, memory applied): https://base-sepolia.blockscout.com/tx/0x532481c39d68fedb7d102407ee819cc19478bcd02ee7bc614ffb8508ad66e0e9

## Final steps

1. Save my build.
2. Mark ready for judging.
3. Rotate the Hugging Face token created during setup; it is no longer needed.
