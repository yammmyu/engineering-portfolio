# Editing the site

How to add and change content. For coding conventions see [AGENTS.md](../AGENTS.md); for
what the site is and what it must not become, [PRODUCT.md](PRODUCT.md).

Run `npm run check` when you're done — it catches most of what goes wrong here.

## Repository layout

```
portfolio/
├── AGENTS.md                     # conventions for anyone (or anything) writing code here
├── CLAUDE.md                     # imports AGENTS.md, for Claude Code
├── docs/
│   ├── PRODUCT.md                # audience, invariants, voice
│   ├── CONTENT.md                # this file
│   ├── JOURNAL.md                # running work log, newest first
│   └── img/                      # README screenshots
├── scripts/
│   ├── check.mjs                 # `npm run check` — conventions the build can't catch
│   └── og.html                   # generator for the share card; see below
├── public/
│   ├── projects/                 # project detail-view images, /projects/<id>.jpg
│   ├── og.png                    # 1200×630 link-preview card, generated
│   ├── resume-en.pdf
│   └── resume-zh.pdf
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── KinematicSketch.jsx   # canvas + controls for the hero sketch
│   │   ├── Experience.jsx        # revision-history table; empty until roles land
│   │   ├── About.jsx
│   │   ├── Projects.jsx
│   │   ├── Contact.jsx
│   │   └── Section.jsx           # SectionHeader / Reveal / Sheet primitives
│   ├── context/
│   │   └── LanguageContext.jsx
│   ├── hooks/
│   │   └── useReveal.js          # scroll-reveal via IntersectionObserver
│   ├── lib/
│   │   ├── ik.js                 # N-link IK solver (from the Math IA)
│   │   └── pickPlace.js          # the idle pick-and-place cycle
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

## Adding a project

Each project needs an entry in two files.

**1. `src/components/Projects.jsx`** — add to the `PROJECTS` array:

```js
new Project({
  id: 'my_new_project',                          // unique; used as translation key stem
  tags: ['robotics', 'software'],                // see available tags below
  date: '2025-06 → 08',                          // optional; see below
  github: 'https://github.com/user/repo',        // optional
  demo: 'https://my-demo.example.com',           // optional
  image: '/projects/my_new_project.jpg',         // optional; see below
  figures: [],                                   // optional; see below
}),
```

The list is ordered by subject rather than by date — robotics first. New rows go where
they belong in that order, not at the end.

**2. `src/translations.json`** — add matching title and description keys (must be
`<id>_title` and `<id>_desc`):

```json
"my_new_project_title": { "en": "My Project", "zh": "我的项目" },
"my_new_project_desc": {
  "en": "Short description in English.",
  "zh": "中文简短描述。"
}
```

Both languages are required, and the file is hand-aligned — match the shape of the entries
around it rather than reformatting. `npm run check` fails on a missing language, on a
project id with no matching keys, and on a key nothing references.

Descriptions run about two sentences and stay concrete: what it is, and what you did on it
if it was a team project. See [PRODUCT.md](PRODUCT.md#voice) for the voice.

### Dates

`date` renders verbatim in the row's left rail, under the `P-NN` reference. It is not a
translation key: numerals and an arrow read the same in both languages.

```
'2025-06'            a single month
'2025-06 → 08'       a range inside one year
'2025-06 → 2026-02'  a range across years
'2025-06 → now'      still going
```

`npm run check` fails on anything else, because the value goes straight to the page rather
than through a formatter that would catch it.

The field is optional and a row without one renders as it always did — but **fill it in
where you can.** Undated, a reader can't tell a project from last term apart from one from
secondary school, and assumes the worse of the two. Never estimate one: an approximate date
on a portfolio is a wrong date in an interview.

### Groups

`GROUP_HEADINGS` in `Projects.jsx` maps a **project id to the subhead that starts there**.
The list runs top down and a new run begins at each id named, so a reader looking for
robotics isn't weighing a side project against a competition robot on the way down. The
first run takes no heading — the section heading is its heading.

```js
const GROUP_HEADINGS = {
  proj_lightpanel: 'projects_bench_heading',   // hardware built by hand
  bloomcraft: 'projects_further_heading',      // everything else
}
```

To move a boundary, change which id is the key — not the array order. Reference numbers
stay continuous across every cut, because they come from the array index and the array is
still one registry in one order.

`npm run check` fails on an id that is not in the registry, on the first row being named
(its heading would sit above rows it does not cover), and on a heading key with no
translation. None of those throw at runtime — the cut silently doesn't happen and the rows
merge into the run above, under the wrong heading.

### Links

A row can carry a `demo` and a `github`, in that order of precedence: the first one present
becomes the row link and supplies the `↗` marker, and the other renders as a small link
beside the tags. Each carries its own label, so a kind is never described as another.

Where a project was built from someone else's design, **say so in the description.** There
is no field for it: crediting a source in prose is a sentence a reader takes in, and a bare
link in the corner is one they have to chase to learn the same thing. See P-08.

### Rows with no link

`github` and `demo` are both optional, and a row may have neither — work under NDA, on an
internal repository, or not yet public. The whole row is normally one stretched
link, so a row with nowhere to go drops the things that advertise one: the title renders as
plain text, the `↗` marker is omitted, and the hover wash and the `P-NN` nudge are
suppressed. What lights up stays exactly what you can press.

Such a row still carries its figure, tags, and description, so it reads as an entry rather
than a broken link. Where the work is not public, say so in the description instead of
linking somewhere that 404s.

**The bench rows exercise this path**, and they are also the only rows that are pressable
without being links — see below. If they ever gain links, check a link-less row by hand
when you change how a row links, because nothing on the page will catch you.

### Detail panels

A row with `figures` becomes expandable: the title turns into a toggle, the whole row is
its hit area, and clicking opens a panel below that pushes the rest of the list down. The
marker reads `DETAIL +` instead of a link's `↗`, and `CLOSE −` once open.

```js
figures: [
  { src: '/projects/proj_lightpanel-sketch.jpg', key: 'proj_lightpanel_fig_sketch' },
],
```

Each entry needs a `key` with a translation, and the row needs a **`<id>_detail`** entry
holding the longer account — paragraphs separated by `\n`. `npm run check` fails on a
missing caption key or a missing `_detail`, and warns on a figure file that isn't there
yet. Captions render as `Fig. 07.1 · Sketch`, numbered from the row.

The panel is where a project's process goes: three frames across at ~330px each, which is
enough for a sketch or a CAD view to read. It is also the only animated layout change on
the site — see the note on `.disclosure` in `index.css` before reaching for the same
technique elsewhere.

**Expandable and linked are mutually exclusive.** A row that has a `github` or a `demo`
uses that as its stretched hit area and ignores its figures, because one click cannot mean
both "go there" and "open this". If you need both, the panel needs its own control rather
than the row.

### Project images

A row's `image` is a path under `public/`, conventionally `/projects/<id>.jpg`. It renders
as a **detail view** in the right-hand columns — a hairline frame, `16:10`, cropped to
fill, captioned `Fig. NN` with the link marker opposite.

Rows without an image fall back to the text-only layout with a marker in the corner, and
**so does a row whose file is missing** — `ProjectFigure` drops itself on the image's
`error` event. So an entry can be added before its screenshot exists, and the site will
not show a broken frame in the meantime. `npm run check` reports these as warnings.

Source images want to be ~960×600 or larger and are lazy-loaded. Anything with fine
detail — an RViz map, a CAD screenshot, a scope trace — should be cropped tight enough to
read at roughly 360px wide, which is the figure's real size on a laptop.

**One figure per row, and it is the finished thing.** A strip showing a project's progress
— sketch, then CAD, then the built object — was tried for P-06, which has all three. The
column is capped at `17rem`, so three panels get ~88px each and none of them reads; on a
phone the figure is wide enough and the order comes out backwards, big where it matters
least. Process belongs in the description, which is read at the same size everywhere.

The frame is `object-cover`, so an image that isn't 16:10 gets **cropped, not fitted** —
which quietly eats the edges of a diagram. Pad it out to 16:10 first rather than letting
the frame choose what to lose:

```bash
sips --resampleHeight 750 in.jpg --out tmp.jpg          # scale up, keep the ratio
sips --padToHeightWidth 750 1200 --padColor FFFFFF tmp.jpg --out public/projects/<id>.jpg
```

A photo beats a diagram as a row's lead figure when one exists — it survives being small,
and it shows the thing rather than describing it. Diagrams carry their own white ground, so
they sit bright on the dark sheet; that reads as a drawing pasted onto the sheet, which is
in keeping, but it is a second choice.

### Available tags

`robotics`, `mechanical`, `electronics`, `software`, `firmware`, `fabrication`

### Adding a new tag

Tags set as one line of mono marks — `ROBOTICS · ELECTRONICS` — under the description. They
were boxed once, which put them at the same visual weight as the language toggle and made
them read as filter chips on a list that has no filter. They are annotation: the only thing
pressable in a row is the row.

A new tag needs two additions:

- `TAG_LABEL_KEYS` in `src/components/Projects.jsx` — maps tag → translation key
- `projects_tag_<name>` entry in `src/translations.json`

`npm run check` fails on a tag used but not registered, and on a registered tag with no
translation.

## The skills BOM

`SKILLS` in `About.jsx`. Each row carries a `usedIn` array of **project ids**, rendered as
the row references that cite it — `P-02, P-06`. The reference numbers come from the
registry order in `Projects.jsx`, so reordering the projects can never leave this table
pointing at the wrong rows.

The column used to repeat the project tags, which told a reader that MATLAB is "software"
and nothing else. Citing rows makes it an index into the evidence instead, and a skill with
no row against it renders `—` — a question worth being asked before an interviewer asks it.

Only cite what a project description actually supports. Which tool did what on a given
project is a fact from the author, not an inference from a tag.

## The share card

`public/og.png` is what a link preview shows in a message, a Slack channel, or a LinkedIn
DM — for a lot of readers it is the first thing they see of the site. It is generated from
the real hero by `scripts/og.html` rather than drawn by hand, so it inherits the tokens,
the fonts, and the title block automatically. The regeneration command is in the comment at
the top of that file.

**Regenerate it whenever the hero or the title block changes**, or the card goes on
advertising last month's facts. `npm run check` verifies the tags resolve and the file
exists; it cannot tell you the picture is stale.

## Other content

| What | Where |
| --- | --- |
| Name, tagline, title-block fields | `hero_*` and `tb_*` keys in `translations.json` |
| Employers, roles, dates | `ROLES` in `Experience.jsx` — see below |
| About text and the skills BOM | `about_*` keys, and the `SKILLS` array in `About.jsx` |
| Contact links and résumés | `CONTACT_LINKS` in `Contact.jsx`; PDFs in `public/` |
| Section names and sheet numbers | `NAV_LINKS` in `Navbar.jsx` + the `sheet` prop per section |
| Content revision in the footer | `REVISION` in `App.jsx` — bump by hand, format `YYYY-MM` |

### The experience sheet

`Experience.jsx` is built and **renders nothing while its `ROLES` array is empty**, which is
how it ships today: employers, titles, and dates are facts about the author and none were
on record. The wiring steps are listed in the comment at the top of the file — fill `ROLES`,
add the `exp_*` keys, mount it in `App.jsx`, add it to `NAV_LINKS`, and renumber the sheets.

It exists because the strongest credential on the site was invisible: an internship
appeared only as an unlinked project row, with no employer, no role, and no dates. Projects
answer *can he build*; this sheet answers *has anyone paid him to*, and a recruiter screens
on the second one first.

Adding or reordering a section changes the sheet sequence, which is a structural decision —
see [PRODUCT.md](PRODUCT.md#open-questions-for-the-user).
