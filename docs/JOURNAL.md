# Journal

Running log of substantial work. **Newest entry first.** Read the top entry before
starting; append a new one before you finish.

Keep entries short. What changed, why, and what you left open — not a diff summary, which
git already has. Skip an entry for a typo fix; write one for anything a future agent would
be surprised by.

Template:

```
## YYYY-MM-DD — Title
**Did:** ...
**Why:** ...
**Open:** ...
```

---

## 2026-08-05 — Agent scaffolding

**Did:** Added [AGENTS.md](../AGENTS.md) (conventions, architecture, styling, motion, i18n,
a11y, working agreements), [docs/PRODUCT.md](PRODUCT.md) (audience, the drawing-set
through-line, invariants, voice), this journal, and `CLAUDE.md` importing AGENTS.md so
Claude Code picks it up automatically.

Added `npm run check` ([scripts/check.mjs](../scripts/check.mjs)), which enforces the
mechanical half of AGENTS.md: both languages on every translation key, project id →
`_title`/`_desc` pairing, no duplicate ids, tags registered in `TAG_LABEL_KEYS` and
translated, orphan keys, every `t('...')` call site resolving, no literal hex outside
`index.css` and the canvas palette, and no Tailwind opacity modifiers on token colours
(the `bg-paper/50` footgun). Missing project images warn rather than fail, since the
graceful fallback in `ProjectFigure` is by design.

Also promoted `.claude/settings.local.json` to a shared `.claude/settings.json` so agents
don't get prompted for `npm run check` / `build` / `dev`, and gitignored the local file.

Fixed one real defect: the `proj_portfolio` row linked to
`github.com/yanyuc/engineering-portfolio`, which 404s. The account is `yammmyu`; corrected
and verified 200.

**Why:** The codebase is unusually well-reasoned — nearly every non-obvious line carries a
comment explaining what was tried and why it was rejected — but none of that was written
down as rules, so a future agent could plausibly "tidy up" the comments or add a rounded
card and quietly destroy the thing that makes it good. Docs alone drift, hence the check
script.

**Open:**
- **Two more project links 404 and may be private repos — needs the user to confirm:**
  `yanyuc/robotic-arm` (`proj_arm`) and `nusrobomaster-comp/PCB27` (`proj_pcb`). Not
  guessed at, since neither has an obvious correct target. If they are private, the rows
  currently link readers to a 404.
- Five project images are referenced but don't exist yet: `proj_drone`, `proj_slam`,
  `proj_aimbot`, `proj_controller`, `proj_arm`. Rows fall back to the text-only layout, so
  this is not broken — but those are five of the eight rows without a figure.
- `public/projects/` is untracked in git, and there were uncommitted edits across ten files
  when this session started. Left alone; the user drives git.
- `Contact.jsx` links `github.com/yammmyu`, and `resume-en.pdf` / `resume-zh.pdf` are
  served from `public/` — worth a periodic check that the résumés are current.
