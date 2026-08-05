# AGENTS.md

Operating guide for any AI agent working in this repo. Read this before touching code.

- **What this is:** a personal engineering portfolio for Yanyu Chen, a Robotics Engineering
  student. React + Vite + Tailwind, static, deployed on Vercel.
- **How it works:** [README.md](README.md) — stack, design system, the IK solver writeup,
  and the procedures for adding a project or a tag.
- **What it's for and what it must never become:** [docs/PRODUCT.md](docs/PRODUCT.md).
  Read it before any design, copy, or content change.
- **Where the last agent left off:** [docs/JOURNAL.md](docs/JOURNAL.md). Read the top entry
  before starting; add one before you finish.

---

## Before you finish, always

```bash
npm run check     # conventions: translations, tags, tokens — must exit 0
npm run build     # must succeed
```

`npm run check` ([scripts/check.mjs](scripts/check.mjs)) enforces the mechanical half of
this document. Warnings are acceptable (missing project images are expected — see below);
errors are not. If you add a convention that can be checked, add it to that script rather
than only writing it here.

There is no test suite and no linter config. `npm run check` and the build are the gate.
Do not add ESLint or Prettier configs without being asked — the style below is already
consistent across every file, and a formatter run would bury a real diff in noise.

---

## The one rule that matters most

**Comments explain *why*, and they record what was tried and rejected.**

This is the defining characteristic of the codebase. Almost every non-obvious line has a
comment giving the reasoning behind it, and often the failure that motivated it:

```jsx
// The row highlighted on hover but only a link in the far corner was
// clickable. The primary link now owns the whole row via a stretched
// pseudo-element, so what lights up is what you can press.
```

```jsx
{/* Everything about the project sits in one column at a readable
    measure. Spreading it across the full 78rem sheet put the title and
    its link 1200px apart and read as two unrelated things. */}
```

These comments are the project's memory. They are why a future agent doesn't
re-introduce a bug that was already fixed once.

- When you make a non-obvious decision, write down why in the same commit.
- When you reject an approach for a concrete reason, say what it was and what went wrong.
- **Never delete one of these comments to tidy up.** If you change the code it describes,
  update the comment to match. If the comment is now wrong, that is a bug.
- Do not add comments that restate the code (`// set the count`). The bar is: would a
  competent engineer reading this line wonder "why like that?" If yes, answer it.

---

## Code style

Matched across every existing file; keep it that way.

- **No semicolons.** Single quotes. 2-space indent. ~100 column width.
- Trailing commas in multiline literals.
- `function Name() {}` declarations for components; arrow functions for callbacks and
  small helpers.
- Default export for a section component, named exports for primitives and hooks.
- **Always include the file extension in imports** (`'./Section.jsx'`, `'../lib/ik.js'`).
- Module-level constants are `SCREAMING_SNAKE` and sit at the top of the file, above the
  components, with a comment if the values are not self-evident.
- `import React from 'react'` explicitly, even where the JSX transform doesn't need it.
- JSDoc `/** */` blocks on components and exported functions whose purpose isn't obvious
  from the name. Inline `{/* */}` in JSX for layout decisions.

## Architecture

```
src/
  components/     section components + Section.jsx primitives
  context/        LanguageContext — EN/ZH state
  hooks/          useReveal — IntersectionObserver scroll reveal
  lib/            pure, dependency-free logic (ik.js)
  models/         Project — id → translation key contract
  index.css       design tokens, base styles, component/utility layers
  translations.json
```

- **`src/lib/` is pure and dependency-free.** No React, no DOM. `ik.js` can be exercised
  directly with `node`. Math and algorithms go here; components draw and handle input.
  `KinematicSketch.jsx` is the drawing layer only — if you find yourself writing geometry
  in it, that belongs in `lib/`.
- **Reuse the primitives in `Section.jsx`** — `Sheet` (gutter + max width), `SectionHeader`
  (sheet number, title, rule), `Reveal` (scroll fade). Don't re-roll a section shell.
- **`Project` in `models/Project.js` owns the id → key contract.** `titleKey` and `descKey`
  derive from the id. Never hardcode `'proj_foo_title'` at a call site.
- The `PROJECTS` array in `Projects.jsx` is the registry. It is **ordered by how much
  robotics is in each project, not by date.** New rows go where they belong in that order.

## Styling

- **Every colour goes through a token.** Tokens are CSS custom properties in `index.css`
  (`--c-paper`, `--c-ink`, `--c-rule`, `--c-accent`, …), exposed to Tailwind as named
  colours in `tailwind.config.js`. `index.css` is the only file where a literal colour
  value may appear. `KinematicSketch.jsx` is the one exception — its canvas palette holds
  deliberate fallbacks for values it reads back via `getComputedStyle`.
- **Never branch on theme in a component.** The dark sheet redefines the same tokens under
  `@media (prefers-color-scheme: dark)`. There is no theme prop, no `dark:` variant.
- **Opacity modifiers do not work on token colours.** `bg-paper/50` resolves to
  `var(--c-paper)/50` and silently produces nothing. Add a new token instead.
- **`accent` is a marking colour — it never sets text.** Use `accent-ink` when the accent
  has to be legible as type. `accent` is for rules, marks, washes, and the end effector.
- **Square corners, hairline rules, no shadows.** There is not one `rounded-*` or
  `shadow-*` in the codebase. That is deliberate; see [docs/PRODUCT.md](docs/PRODUCT.md).
- Reach for `.label` for any mono caption, column header, or data value.

## Motion

- Animate **`transform` and `opacity` only**. Nothing that triggers layout.
- Use the custom curves `var(--ease-out)` / `var(--ease-in-out)`, not Tailwind's defaults.
- Budget: interaction ≤ 300ms, entrance ~450ms, the section rule draw 700ms.
- **Gate hover nudges behind `@media (hover: hover) and (pointer: fine)`**, so a tap on a
  touch device doesn't strand an element in its hovered state.
- **Everything must have a `prefers-reduced-motion: reduce` path**, including the canvas —
  it drops to a single static frame rather than animating.
- The canvas loop only runs while the figure is on screen and the tab is visible. Keep it
  that way.

## Content and i18n

- **Every user-visible string goes through `t()`** and lives in `translations.json` with
  **both `en` and `zh`.** No exceptions, and no English fallback left as a TODO. `npm run
  check` fails on a missing language.
- Keys are flat snake_case, grouped by section in file order.
- Project entries need matching `<id>_title` and `<id>_desc` keys. The full procedure for
  adding a project or a tag is in [README.md](README.md#adding-a-project).
- Chinese is not a machine translation of the English — it is written to read naturally in
  Chinese. If you are not confident writing it, say so rather than guessing.
- **Never invent a project, a skill, a date, or a credential.** This page represents a real
  person applying for real roles. Content facts come from the user, not from you.
- A project image is optional and a *missing* image is handled gracefully — `ProjectFigure`
  removes itself on the image `error` event, so a row can be added before its screenshot
  exists. `npm run check` warns about these rather than failing.

## Accessibility

Non-negotiable, and cheap to keep.

- Decorative elements get `aria-hidden="true"`. Icon-only controls get an `aria-label`.
- Body text holds ≥ 4.5:1 on **both** sheets. `--c-ink-3` is tuned to exactly this — don't
  lighten it.
- Don't remove the global `:focus-visible` outline.
- Honour `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast`.
  All three already have paths in `index.css`; new work should not bypass them.
- Interactive targets are sized for a fingertip, not for the glyph inside them.

## Working agreements

- **The user is the decision-maker on content, design direction, and scope.** Fix defects
  freely; propose redesigns rather than performing them.
- **Don't commit or push unless asked.** The user drives git.
- Don't add a dependency without asking. The runtime dependency list is React and
  React DOM, and the page loads in ~60kB gzipped. That is a feature.
- Don't add analytics, tracking, cookies, or a backend. See
  [docs/PRODUCT.md](docs/PRODUCT.md).
- Don't edit `dist/` — it's build output and gitignored.
- **Append a `docs/JOURNAL.md` entry before you finish.** Newest first. Say what changed,
  why, and what you left open.
