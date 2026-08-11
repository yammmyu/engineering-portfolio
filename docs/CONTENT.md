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
│   └── check.mjs                 # `npm run check` — conventions the build can't catch
├── public/
│   ├── projects/                 # project detail-view images, /projects/<id>.jpg
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
  github: 'https://github.com/user/repo',        // optional
  demo: 'https://my-demo.example.com',           // optional
  image: '/projects/my_new_project.jpg',         // optional; see below
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

### Rows with no link

`github` and `demo` are both optional, and a row may have neither — work under NDA, on an
internal repository, or not yet public. The whole row is normally one stretched link, so a
row with nowhere to go drops the things that advertise one: the title renders as plain
text, the `↗` marker is omitted, and the hover wash and the `P-NN` nudge are suppressed.
What lights up stays exactly what you can press.

Such a row still carries its figure, tags, and description, so it reads as an entry rather
than a broken link. Where the work is not public, say so in the description instead of
linking somewhere that 404s.

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

`robotics`, `mechanical`, `electronics`, `software`, `firmware`

### Adding a new tag

Tags share one hairline chip style, so a new tag needs two additions:

- `TAG_LABEL_KEYS` in `src/components/Projects.jsx` — maps tag → translation key
- `projects_tag_<name>` entry in `src/translations.json`

The About table reuses these same `projects_tag_*` keys as BOM categories, so a new tag
is available there too. `npm run check` fails on a tag used but not registered, and on a
registered tag with no translation.

## Other content

| What | Where |
| --- | --- |
| Name, tagline, title-block fields | `hero_*` and `tb_*` keys in `translations.json` |
| About text and the skills BOM | `about_*` keys, and the `SKILLS` array in `About.jsx` |
| Contact links and résumés | `CONTACT_LINKS` in `Contact.jsx`; PDFs in `public/` |
| Section names and sheet numbers | `NAV_LINKS` in `Navbar.jsx` + the `sheet` prop per section |

Adding or reordering a section changes the sheet sequence, which is a structural decision —
see [PRODUCT.md](PRODUCT.md#open-questions-for-the-user).
