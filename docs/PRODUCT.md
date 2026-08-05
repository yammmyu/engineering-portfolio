# What this site is for

Read this before any change to design, copy, or content. [AGENTS.md](../AGENTS.md) covers
*how* to write code here; this covers *what the site is*, and the lines not to cross.

## Who it's for

One person's portfolio: **Yanyu Chen, Robotics Engineering student.** It exists to get him
into rooms — internships, research groups, competition teams, graduate programmes.

The reader is a **recruiter, hiring manager, or engineer with about sixty seconds.** They
have a stack of these to get through. Two of them are technical enough to care whether the
IK solver actually works; the rest are scanning for whether this person builds real things.
The site has to serve both without slowing either down.

A meaningful share of that audience reads Chinese. That is why the site is bilingual, and
why bilingual parity is an invariant rather than a nice-to-have.

## What the reader needs, in order

1. **What does he do?** Answered in the hero, above the fold, in one line.
2. **Is he any good?** Answered by the projects — real repos, real hardware, specific.
3. **Can he actually build?** Answered by the hero sketch before they read a word of it: a
   working N-link IK solver responding to their pointer is a demonstration, not a decoration.
4. **How do I reach him?** Answered without hunting — contact and both résumés are one
   scroll away and always reachable from the nav.

Anything that doesn't serve one of those four is a candidate for deletion, not addition.

## The through-line: it is a drawing set

The whole site is built as an **engineering drawing set**, and the metaphor is structural
rather than decorative. It maps onto real content:

| Drawing convention | What it actually is |
| --- | --- |
| Sheet numbers (01, 02, 03) | Nav order and section order |
| Title block | Role, focus, status, languages |
| Bill of materials | The skills table |
| Drawing list | The projects list |
| Detail view, `Fig. NN` | Project screenshots |
| Registration marks | The sheet corners |
| Dimension callouts | The end effector's live X/Y readout |

This is the site's whole personality, and it is doing a job: it says *this person thinks
like an engineer* before any claim to that effect is read. **When adding anything new, find
its drawing-set equivalent first.** A new section is a new sheet. A new data display is a
table or a callout. If something has no equivalent, that is a strong signal it doesn't
belong.

## Invariants

Things this site must never become. If a request would break one of these, say so, explain
why, and offer the nearest thing that doesn't — then do what the user decides.

**Visual**

- **It never becomes a generic startup landing page.** No rounded cards with drop shadows,
  no gradient hero, no glassmorphism panels, no floating blobs, no stock illustration.
  There is currently not a single `rounded-*` or `shadow-*` in the codebase. Keep it there.
- **Square corners and hairline rules.** Structure comes from 1px rules and real alignment,
  not from boxes and elevation.
- **The amber accent stays rare.** It's a marking colour — a wash, an underline, the end
  effector. The moment it becomes a fill for buttons and headings, the drafting metaphor
  reads as branding and the whole thing collapses into a template.
- **Restraint over motion.** Motion confirms an action or reveals content arriving. It never
  performs. No parallax, no scroll-jacking, no animated counters.

**Substance**

- **The hero sketch stays real.** `src/lib/ik.js` is a genuine solver, ported and corrected
  from the author's Math IA, with the bugs documented in [README.md](../README.md#the-hero-sketch).
  It must never be swapped for a video, a Lottie file, or a canned animation. It being real
  is the entire point of it.
- **Content is true.** Never invent a project, skill, metric, date, or credential. Never
  inflate a team project into a solo one. Facts come from the user.
- **The projects list is ordered by robotics content, not by date.** The first rows are what
  the section is about.

**Reader-respecting**

- **Bilingual parity.** EN and 中文 are equal. Never ship a string in one language only, and
  never leave Chinese as a machine-translated placeholder.
- **No analytics, no tracking, no cookies, no consent banner, no backend.** A static page
  that asks the reader for nothing. This is a deliberate choice, not an oversight.
- **It stays fast.** ~60kB gzipped today, no runtime dependency beyond React. A portfolio
  that takes three seconds to paint has already made its argument.
- **It respects OS preferences** — colour scheme, reduced motion, reduced transparency,
  increased contrast. All four have paths in `index.css`. Never bypass them.
- **It works on a phone.** A large share of first views are mobile, often from a link in a
  message. Every interaction has a touch path, including the canvas.

## Voice

- **Plain and specific.** "N-link planar arm solving inverse kinematics toward the pointer",
  not "innovative robotics solutions".
- **Understated.** The work carries the claim. No superlatives, no "passionate about", no
  exclamation marks.
- **First person, sparingly.** The site describes work, not feelings about work.
- Labels are mono, uppercase, and terse — they're drawing annotations, not sentences.

## Open questions for the user

Things an agent should ask rather than decide:

- Whether a new project belongs on the list at all, and where in the robotics ordering.
- Any change to how he is described — role, focus, status, availability.
- Adding a section, changing the nav, or anything that alters the sheet sequence.
- Anything that trades one of the invariants above for something else.
