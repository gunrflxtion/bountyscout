# BountyScout — AI Bug Bounty Program Scout

**SLAY HACKS 2026 submission** · [Live demo](#) (GitHub Pages — enable in repo Settings → Pages) ·
[Devpost](https://slayy-hacks.devpost.com/)

Paste a bug bounty program page and get an instant **GO / CAUTION / SKIP** verdict:
reward, submit fee, reputation gate, KYC and scope — extracted and scored in seconds,
before you spend a single hour auditing a program you cannot even submit to.

## The problem

Security researchers waste days auditing programs they cannot submit to: a $100
pay-to-submit fee found after the audit, a 120-point reputation gate, a KYC wall at
payout, or a scope outside their stack. Program pages hide these gates in long rules
text. BountyScout reads the page for you and surfaces the decision facts first.

In one real research round, **3 of 11 programs** were unauditable for a free-first
hunter with zero reputation — despite headline rewards up to **$500,000**. Each one
cost hours of reading and audit work before the gate was found. BountyScout finds
the gate in seconds.

## How it works

1. **Extract.** A deterministic pattern + keyword pipeline (`engine.js`) reads the
   program text: reward amounts (`$` and `USDC`), submit fees (including
   "100 credits = 100 USDC"), reputation gates ("120+ points"), KYC mentions,
   scope (EVM / Move / Rust / Web), deadlines, and free-submission signals.
   "Out of scope" clauses are excluded, so "IOTA EVM out of scope" is not misread
   as EVM scope.
2. **Score.** A transparent additive model, 0–100. Free submission +20, high reward
   up to +15, EVM scope +10, early/live +5; fees −25/−35, reputation gates −20/−25,
   KYC −5. Hard caps: an entry fee of $50+ or a 100+ reputation gate caps the score
   at SKIP — a hunter with zero reputation literally cannot enter.
3. **Explain.** Every point adjustment is listed as a human-readable reason, so the
   verdict is auditable. Results export as a Markdown brief with a pre-audit checklist.
4. **Optional AI second opinion.** With your own OpenRouter API key (stored only in
   your browser's `localStorage`, never sent anywhere else), a free-tier LLM re-reads
   the same text and agrees or disagrees with reasons. The deterministic verdict is
   always shown first; the LLM never overrides it silently.

## Run it

No build, no server, no API key required for the core:

```bash
# Option A — just open it
open index.html            # or double-click in your file manager

# Option B — local server
python3 -m http.server 8000
# then visit http://localhost:8000
```

Click any row in the "11 real programs" table to load that program into the analyzer.

## Tests

```bash
node tests/engine.test.js   # 13 tests, zero dependencies
```

The tests cover extraction (reward, credit-fee, reputation gate, KYC, scope,
"out of scope" negation), verdicts on realistic program texts (free high-reward
EVM → GO; pay-to-submit / gated → SKIP), and the Markdown brief export.

## Project structure

```
index.html            — page + copy
style.css             — theme (dark, responsive, no framework)
app.js                — UI: analyzer, sample table, brief export, optional LLM check
engine.js             — the analyzer: extract → score → verdict → brief (browser + Node)
data/programs.json    — 11 real programs (public pages, Nov 2026) — the dataset
scripts/build.js      — injects programs.json into app.js so file:// works offline
tests/engine.test.js  — 13 tests, Node built-in assert only
docs/screenshots/    — screenshots for the Devpost submission
```

Rebuild after editing the dataset: `node scripts/build.js`.

## Honest limits

- The extractor reads what the text says. A gate the page does not mention cannot
  be detected — always verify fee, reputation and KYC live on the program page
  before auditing.
- Reward and scope heuristics are tuned for EVM smart-contract programs; Move/Rust
  and web programs score lower by design (the hunter's stack), not by quality.
- BountyScout is a triage tool, not a guarantee of payout.

## License

MIT — see `LICENSE`.
