# UI Audit Report

**Project:** Groundhog Vault production hybrid
**Date:** 2026-08-17
**Auditor:** Codex using the UI Revamp phase-one checklist

## Executive summary

| Category | Critical | Major | Minor |
|---|---:|---:|---:|
| Experiment integrity | 0 | 1 | 0 |
| Accessibility | 0 | 2 | 1 |
| Interaction | 0 | 1 | 1 |
| Typography and visual | 0 | 0 | 3 |
| Resilience | 0 | 0 | 1 |
| **Total** | **0** | **4** | **6** |

**Overall assessment:** Moderate issues. The selected visual direction is coherent and the real Sibyl API path works, but the staged interface needs one experiment-integrity refactor and a focused accessibility pass before production polish.

> Resolution (2026-08-17): all findings below were addressed. The experiment now advances through separate run-creation, Life 1, and Life 2 requests; overlay focus and inert states are managed; announcements are scoped; typography is tokenized; reduced motion and mobile table affordances are present. The final automated audit reports 0 violations.

The automated audit reported two major hover violations at `web/styles/app.css:106-107`. Manual inspection confirmed both hover selectors are already contained within `@media (hover: hover)`, so these are scanner false positives rather than actual violations.

## Major violations

### 1. UI chronology and backend chronology differ

- **Location:** `web/app.js:loadExperiment`, `/api/demo`
- **Issue:** The first button click runs both lives on the backend and stages their display afterward. The visible story says Life 2 runs only after runtime destruction. Session IDs and Sibyl persistence are real, but the network chronology should match the presentation exactly.
- **Impact:** Weakens experimental legibility if a judge inspects network calls.
- **Fix:** Replace the one-shot endpoint with run creation and incremental life endpoints. Execute Life 1, persist memory, return; only execute Life 2 after the reset action.

### 2. Non-native overlays do not manage focus

- **Location:** loading, resetting, and error overlays in `web/index.html`
- **Issue:** Visual overlays cover the interface, but keyboard focus can remain behind them. The error alertdialog does not move focus into itself or restore it after dismissal.
- **Impact:** Keyboard and screen-reader users can interact with obscured controls.
- **Fix:** Make loading/resetting inert states, move focus into the error dialog, trap focus while open, and restore the triggering control on close.

### 3. Skip link targets a hidden scene

- **Location:** `.skip-link`, `#main-content`
- **Issue:** On the cinematic entry screen, the skip link points to the hidden application shell and does not change the active scene.
- **Impact:** Keyboard users cannot reliably bypass the introduction.
- **Fix:** Handle skip activation by entering the app, selecting Arena, and focusing the main heading.

### 4. Dynamic announcements are too broad

- **Location:** `.vault-grid[aria-live]`
- **Issue:** Updating several values can cause a screen reader to announce an entire two-column region.
- **Impact:** Important state changes become noisy and difficult to understand.
- **Fix:** Remove the broad live region and add one concise status announcer for phase, allocation divergence, and Memory Lift.

## Minor violations

1. `!important` is used for controller typography instead of a more specific selector.
2. The interface uses more than four effective type sizes within the arena view; consolidate the literal heading and value sizes into the token scale.
3. The mobile production table scrolls horizontally without a visible scroll affordance or instruction.
4. The cinematic reset lasts 1.1 seconds. It is intentional, but should expose progress and collapse to near-instant under reduced motion.
5. Remote fonts are presentation dependencies. Local fallbacks work but do not retain the full selected identity offline.
6. Evidence and Field Map are reachable before a run. Their empty states are valid, but nav labels should show that evidence is pending.

## Quick wins

1. Remove the `!important` declaration and narrow the selector.
2. Add a dedicated `aria-live` status node and remove the broad live region.
3. Fix skip-link scene activation and focus destination.
4. Add a mobile “Swipe to compare columns” affordance.
5. Replace literal font sizes with the existing token scale.

## Visual inventory

### Border radius

- `0` for all controls and panels.
- Full-circle radius only for status dots and the cinematic orbit.
- **Assessment:** Pass; two intentional values.

### Spacing

- 4px base scale from `--space-1` through `--space-20`.
- **Assessment:** Pass; the layout uses tokens consistently.

### Typography

- Declared tokens: 11px, 13px, 16px, responsive display, responsive hero.
- Additional literals: 18.4px, 20px, 24.8px, 28.8px, 32px, 38.4px.
- **Recommendation:** Collapse value and subsection headings into two additional named tokens, keeping each view to four active levels.

### Icon style

- No icon set is currently used.
- **Assessment:** No inconsistency.

## Heuristic scores

| Heuristic | Score | Notes |
|---|---:|---|
| System status | 0 | Explicit phase, loading, reset, success, and error states. |
| Real-world match | 1 | Strong treasury language; a few internal terms remain. |
| User control | 1 | New-run confirmation works; loading cannot be cancelled. |
| Consistency | 1 | Strong grid and token system; typography needs consolidation. |
| Error prevention | 0 | Clean-run action is confirmed and no funds are real. |
| Recognition | 0 | Current action and experiment variable remain visible. |
| Flexibility | 1 | Good navigation; no compact presenter controls yet. |
| Minimalism | 1 | Entry is focused; arena density is intentional but high. |
| Error recovery | 2 | Retry exists, but focus behavior needs correction. |
| Help and documentation | 1 | Field map explains the product; no explicit demo guide. |

**Average:** 0.8 / 4

## Recommended implementation order

1. Align backend execution with Life 1 and Life 2 UI actions.
2. Fix focus, skip-link, live-region, inert-state, and reduced-motion behavior.
3. Consolidate typography and remove the specificity override.
4. Add mobile table affordance and pending-evidence navigation state.
5. Re-run automated audit, keyboard test, 375px/1400px visual captures, blur test, and squint test.
