# Handoff — 4.0 lock-down applied from the workspace session (2026-09-12)

Session: the workspace Cowork session (see workspace/handoffs/2026-09-12-phase-4-lockdown-repos-brief-spec.md
for the full record). Only config and observations here; no code changed.

## What changed
- `data/projects.json`: Wild Pearl `path` → null (skip-worktree; local only)
- `data/daemon-config.json`: polling.enabled false; dailyPlan/standup/weeklyReview enabled false;
  allowedTools Read, Glob, Grep, Edit, Write, Bash (was + WebSearch, WebFetch). TRACKED — uncommitted.
- Board: new project `workspace` (proj_gssbOpEgXXFt, path /Users/basil/Desktop/Projects/workspace) and
  three test tasks, all done.

## Verified (daemon.log + inbox.json read from the mount)
- 3 Runs: `will run in /Users/basil/Desktop/Projects/workspace`, `Allowed tools: Read, Glob, Grep, Edit,
  Write, Bash`, exit 0 each. WebSearch denied cleanly ("you haven't granted it yet"), 16 s.
  `ls ~/Desktop/Wild Pearl | wc -l` → 18 from the agent, no prompt.

## NOT verified
- Whether the daemon was running; config is read at start, so a running daemon needs a restart.

## Defects
- Completion-report parse failure, intermittent (STATE.md known limits).

## Next
- Commit daemon-config.json. 4.4 and 4.5 per workspace STATE.md.
