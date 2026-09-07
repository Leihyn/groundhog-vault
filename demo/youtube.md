# YouTube upload

Everything below is ready to paste. The video is `demo/groundhog-vault-demo.mp4`
(2:25, 1080p, captions burned in).

## Settings

| Field | Value |
|-------|-------|
| Visibility | Unlisted |
| Category | Science & Technology |
| Audience | Not made for kids |
| Subtitles | Upload `demo/captions.srt` as an English track |
| Comments | Your call; judges do not read them |

Burned-in captions cover the picture, but upload the SRT anyway. It makes the
video searchable, feeds YouTube's transcript panel, and works with screen
readers.

## Title

```
Groundhog Vault: proving agent memory changes a treasury decision
```

## Description

```
A treasury agent puts 30% into a pool. The pool depegs. Eighteen thousand dollars, gone. Then the session ends, and the agent forgets it ever happened.

Groundhog Vault is a controlled experiment on exactly that failure. Two agents receive the same capital, the same decision logic, and the same market. Both runtimes are destroyed between rounds. Only one of them can read a persisted Sibyl risk policy.

In round one both allocate 30% to MoonPool and lose $18,000. Groundhog writes the loss to Sibyl as an incident entity and an append-only event, then promotes a 5% exposure cap keyed to the risk signature rather than the protocol name. In round two SunPool carries a new name and the same signature. A fresh Groundhog session recalls the policy and caps exposure at 5%. Amnesiac repeats 30%. Memory alone preserves $12,300.

The same path runs on a treasury's own history. Record a real incident, then evaluate a differently named proposal in a brand new session. The recommendation cites the policy and the incident behind it, and the user signs it as a decision receipt on Base Sepolia. The agent never holds the wallet.

Chapters
0:00 The problem: a loss the agent forgets
0:18 The experiment: two agents, one variable
0:29 Life 1: both lose $18,000
0:40 Runtimes destroyed, the memory survives
0:53 Life 2: 5% versus 30%
1:10 Evidence: incident to policy to decision
1:25 Persist, recall, decide (the Sibyl calls)
1:36 Your own treasury history
1:52 A user-signed receipt on Base Sepolia
2:05 Production boundary and close

Every frame of the interface is a real recording of the running app, and the Base Sepolia transaction shown is live.

Code: https://github.com/Leihyn/groundhog-vault
Decision receipt: https://base-sepolia.blockscout.com/tx/0x532481c39d68fedb7d102407ee819cc19478bcd02ee7bc614ffb8508ad66e0e9
Receipt registry: https://sepolia-explorer.base.org/address/0x980ea2442f51f39f7d0b257ec8c3449e630434f4

Built for the Sibyl hackathon by @leihyn.
Python, the Sibyl memory client, Solidity on Base Sepolia, Foundry.
```

## Tags

```
AI agents, agent memory, persistent memory, Sibyl, DeFi treasury, treasury management, risk policy, smart contracts, Base, Base Sepolia, onchain receipts, Solidity, autonomous agents, LLM agents, hackathon
```

## Pinned comment (optional)

```
The experiment is reproducible from a clean clone: github.com/Leihyn/groundhog-vault. Swap the memory client for NoMemory and Groundhog makes the same decision as the control, which is the point.
```

## Why the chapters start where they do

YouTube drops the entire chapter list if any chapter runs under ten seconds.
Two scenes land at 9.6 and 9.7 seconds, so their marks sit a second or two
before the scene actually starts. The list above already accounts for it. If you
retime the video, recheck every gap before pasting.
