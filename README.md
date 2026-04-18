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
- Projects section with card layout — each card has title, description, tags (mechanical / software / robotics), and optional GitHub / demo links
- Clean, minimal design — lots of whitespace, simple typography

## Project Structure (planned)

```
portfolio/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Projects.jsx
│   │   └── Contact.jsx
│   ├── context/
│   │   └── LanguageContext.jsx
│   ├── models/
│   │   └── Project.js
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

If you need a tag that doesn't exist yet, add it in three places:

- `TAG_STYLES` in `src/components/Projects.jsx` — Tailwind classes for the pill
- `TAG_LABEL_KEYS` in `src/components/Projects.jsx` — maps tag → translation key
- `projects_tag_<name>` entry in `src/translations.json`

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
