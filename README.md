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
│   ├── translations.json
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

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
