# Personal Engineering Portfolio

A personal engineering portfolio website for a Robotics Engineering student, showcasing a mix of mechanical and software projects.

## Stack

- **React + Vite** — fast development and optimized builds
- **Tailwind CSS** — utility-first styling
- **Vercel** — hosting, with custom Cloudflare domain (DNS-only / grey cloud)

## Features

- Single-page layout: Navbar, Hero, About Me, Projects, Contact
- Bilingual support (EN / 中文) — toggle in the navbar switches the entire site
- All translatable strings live in `src/translations.json` (`{ "key": { "en": "...", "zh": "..." } }`)
- Language state managed via React Context
- Projects section as a drawing list — each row has title, description, tags (mechanical / software / robotics / firmware), and optional GitHub / demo links
- Light and dark themes, following the OS preference
- Interactive hero: an N-link planar arm solving inverse kinematics toward the pointer, drawn on canvas, with a control to add and remove joints

## Design System

The UI is built as an **engineering drawing set**: hairline rules, sheet numbering, a
title block, a bill of materials, and a drawing list. Structural devices map to real
content — nav order is sheet order, the skills table is a BOM, projects are drawing-list
rows.

**Color** lives entirely in CSS custom properties in `src/index.css` (`--c-paper`,
`--c-ink`, `--c-rule`, `--c-accent`, …) and is exposed to Tailwind as named colors in
`tailwind.config.js`. The dark theme redefines the same tokens under
`@media (prefers-color-scheme: dark)`, so components never branch on theme.

> Because the Tailwind colors resolve to `var(...)`, **opacity modifiers like
> `bg-paper/50` will not work.** Add a token instead.

The amber accent is a *marking* color — washes, underlines, the end effector. It never
carries text on its own; links are ink with an amber underline. This keeps contrast
legible on both grounds.

**Type** is Archivo (variable width axis, set to 125% via `.font-expanded`) for display,
IBM Plex Sans for body, IBM Plex Mono for every label and data value. All three stacks
append system CJK faces so 中文 falls back deliberately.

**Motion** uses the custom curves `--ease-out` / `--ease-in-out`, animates only
`transform` and `opacity`, gates hover nudges behind `(hover: hover) and (pointer: fine)`,
and is fully disabled under `prefers-reduced-motion` (including the canvas, which drops to
a single static frame).

## The Hero Sketch

`src/lib/ik.js` holds two planar N-link inverse kinematics solvers.
`src/components/KinematicSketch.jsx` is purely the drawing and interaction layer.

**`resolveIk`** is ported from the pygame simulation in my Math IA. The chain is solved
backwards from the end effector: each joint is placed where a circle of the current
link's length around the tip meets a circle of the sub-chain's reach around the base. It
runs once, to seed the arm's opening pose.

**`solveFabrik`** drives every frame after that. It alternates a pass from the tip inward
and one from the base outward, each restoring exact link lengths, starting from the pose
the arm is already in.

The switch was about how the motion reads. `resolveIk` is stateless, and its free
parameter scales by how far the target is overall, so every joint reconfigures no matter
how little the target moved — the arm behaves like a tentacle rather than a mechanism.
Measuring each joint's movement against the tip's over a sweep:

| solver | base | | | | tip |
| --- | --- | --- | --- | --- | --- |
| `resolveIk` | 0.00 | 0.55 | 0.56 | 0.82 | 1.00 |
| `solveFabrik` | 0.00 | 0.14 | 0.42 | 0.75 | 1.00 |

FABRIK being incremental also makes it continuous for free, and lets the support plane be
a positional constraint applied inside the forward pass. That constraint spends
redundancy, so it is disabled for a 2-link arm, whose single elbow is fully determined by
the goal and has none to spend.

Three things changed in the port of the IA solver:

- The IA's `find_side` searched for a sub-chain length satisfying the triangle inequality,
  but its predicate ORs the three conditions, so it always accepted the first candidate
  and every sub-chain came back fully taut. A taut sub-chain has to lie radially, which
  collapsed the arm to a straight line with one bend at the last link. `subChainReach`
  scales the target extension by how far the goal actually is — identical to the original
  at full stretch, and distributing the fold across every joint closer in.
- `get_intersections` clamped the centre-line distance `a` to `≥ 0`. It is legitimately
  negative whenever the link circle is smaller than the sub-chain circle, which is the
  common case, and clamping placed the joint off its own circle.
- The reachable region is an annulus, not a disc. Targets inside the inner dead zone are
  pushed back out to it, so a chain with one dominant link stays rigid near the base.

### Keeping the motion smooth

Running `resolveIk` per frame also twitched badly, for a separate reason. Every step has
two valid solutions — mirror images across the line joining the two circle centres — and
picking "whichever intersection is higher" decides that afresh on every solve. When a
pair sits near level, a sub-pixel change of target flips a whole sub-chain to its mirror
pose: on a smooth sweep, joint jumps of 100–250px, several joints at once. Solving from
the previous pose is what removes this, and FABRIK does it inherently, holding the worst
jump under 2px.

Only the goal is eased, not the pose. FABRIK already moves incrementally from wherever
the arm is, so easing the joints on top of it just fights the solver. The easing uses a
time constant rather than a fixed fraction per frame, so the arm moves at the same rate
on 60Hz and 120Hz displays.

Both solvers are pure and dependency-free, so they can be exercised directly with Node.

## Project Structure

```
portfolio/
├── public/
│   ├── resume-en.pdf
│   └── resume-zh.pdf
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── KinematicSketch.jsx   # canvas + controls for the hero sketch
│   │   ├── About.jsx
│   │   ├── Projects.jsx
│   │   ├── Contact.jsx
│   │   └── Section.jsx           # SectionHeader / Reveal / Sheet primitives
│   ├── context/
│   │   └── LanguageContext.jsx
│   ├── hooks/
│   │   └── useReveal.js          # scroll-reveal via IntersectionObserver
│   ├── lib/
│   │   └── ik.js                 # N-link IK solver (from the Math IA)
│   ├── models/
│   │   └── Project.js
│   ├── index.css                 # design tokens, base styles, utilities
│   ├── translations.json
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Adding a Project

Each project needs an entry in two files.

**1. `src/components/Projects.jsx`** — append to the `PROJECTS` array:

```js
new Project({
  id: 'my_new_project',                          // unique; used as translation key stem
  tags: ['robotics', 'software'],                // see available tags below
  github: 'https://github.com/user/repo',        // optional
  demo: 'https://my-demo.example.com',           // optional
}),
```

**2. `src/translations.json`** — add matching title and description keys (must be `<id>_title` and `<id>_desc`):

```json
"my_new_project_title": { "en": "My Project", "zh": "我的项目" },
"my_new_project_desc": {
  "en": "Short description in English.",
  "zh": "中文简短描述。"
}
```

### Available tags

`robotics`, `mechanical`, `software`, `firmware`

### Adding a new tag

Tags share one hairline chip style, so a new tag needs two additions:

- `TAG_LABEL_KEYS` in `src/components/Projects.jsx` — maps tag → translation key
- `projects_tag_<name>` entry in `src/translations.json`

The About table reuses these same `projects_tag_*` keys as BOM categories, so a new tag
is available there too.

## Deployment

Build output is standard Vite (`dist/` folder), deployable directly to Vercel. Domain is configured via Cloudflare in DNS-only mode (grey cloud).

## Getting Started

```bash
npm install
npm run dev
```

```bash
npm run build   # outputs to dist/
```
