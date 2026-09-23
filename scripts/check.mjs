#!/usr/bin/env node
/**
 * Repo conventions check. Run with `npm run check`.
 *
 * The rules in AGENTS.md that can be verified mechanically live here, so they
 * are enforced rather than merely written down. Everything this catches is a
 * real defect on a shipped page: an untranslated string, a project row whose
 * title renders as `proj_foo_title`, a colour that ignores the dark sheet.
 *
 * Exit 0 = clean (warnings allowed), 1 = at least one error.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const rel = p => relative(ROOT, p)
const read = p => readFileSync(join(ROOT, p), 'utf8')

const errors = []
const warnings = []
const fail = (file, msg) => errors.push({ file, msg })
const warn = (file, msg) => warnings.push({ file, msg })

/** Every .js/.jsx file under src/, recursively. */
function sourceFiles(dir = 'src') {
  const out = []
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...sourceFiles(path))
    else if (/\.jsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

const files = sourceFiles()
const source = Object.fromEntries(files.map(f => [f, read(f)]))
const allSource = Object.values(source).join('\n')

const translations = JSON.parse(read('src/translations.json'))
const projectsSrc = source['src/components/Projects.jsx']

// ── Projects.jsx is the registry; parse the shape rather than importing JSX ──
const projects = [...projectsSrc.matchAll(/new Project\(\{([\s\S]*?)\}\)/g)].map(m => {
  const body = m[1]
  const id = body.match(/id:\s*'([^']+)'/)?.[1]
  const tags = [...(body.match(/tags:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
    t => t[1],
  )
  return {
    id,
    tags,
    date: body.match(/date:\s*'([^']+)'/)?.[1] ?? null,
    image: body.match(/image:\s*'([^']+)'/)?.[1] ?? null,
    link: body.match(/(?:github|demo):\s*'([^']+)'/)?.[1] ?? null,
    figures: [
      ...(body.match(/figures:\s*\[([\s\S]*?)\]/)?.[1] ?? '').matchAll(
        /\{\s*src:\s*'([^']+)',\s*key:\s*'([^']+)'\s*\}/g,
      ),
    ].map(m => ({ src: m[1], key: m[2] })),
    video: (() => {
      const block = body.match(/video:\s*\{([\s\S]*?)\}/)?.[1]
      if (!block) return null
      const field = n => block.match(new RegExp(`${n}:\\s*'([^']+)'`))?.[1] ?? null
      return {
        src: field('src'),
        poster: field('poster'),
        key: field('key'),
        position: field('position'),
      }
    })(),
  }
})

const registeredTags = [
  ...(projectsSrc.match(/const TAG_LABEL_KEYS = \{([\s\S]*?)\}/)?.[1] ?? '').matchAll(
    /(\w+):\s*'([^']+)'/g,
  ),
].map(m => ({ tag: m[1], key: m[2] }))

// ── 1. Both languages present on every key ───────────────────────────────────
for (const [key, entry] of Object.entries(translations)) {
  for (const lang of ['en', 'zh']) {
    if (!entry?.[lang]?.trim()) {
      fail('src/translations.json', `"${key}" is missing a ${lang} string`)
    }
  }
}

// ── 2. Every project id resolves to a title and a description ────────────────
if (!projects.length) fail('src/components/Projects.jsx', 'no Project entries parsed')
for (const { id } of projects) {
  if (!id) {
    fail('src/components/Projects.jsx', 'a Project entry has no id')
    continue
  }
  for (const suffix of ['_title', '_desc']) {
    if (!translations[id + suffix]) {
      fail('src/translations.json', `project "${id}" has no "${id}${suffix}" key`)
    }
  }
}

const ids = projects.map(p => p.id)
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
for (const id of new Set(duplicates)) {
  fail('src/components/Projects.jsx', `duplicate project id "${id}"`)
}

// ── 3. Every tag used is registered, and every registered tag is translated ──
for (const { id, tags } of projects) {
  for (const tag of tags) {
    if (!registeredTags.some(r => r.tag === tag)) {
      fail('src/components/Projects.jsx', `project "${id}" uses unregistered tag "${tag}"`)
    }
  }
}
for (const { tag, key } of registeredTags) {
  if (!translations[key]) {
    fail('src/translations.json', `tag "${tag}" maps to missing key "${key}"`)
  }
}

// ── 4. No translation key left behind ────────────────────────────────────────
// A key counts as referenced if it appears literally anywhere in src, or is
// derived from a project id by the Project model's titleKey / descKey getters.
// `_detail` is derived too, but only for a row that has a panel to show it in.
// Listing it unconditionally would hide a detail key left behind by a row whose
// figures were removed.
const derived = new Set(
  projects.flatMap(p => [
    `${p.id}_title`,
    `${p.id}_desc`,
    ...(p.figures.length ? [`${p.id}_detail`] : []),
  ]),
)
for (const key of Object.keys(translations)) {
  if (derived.has(key)) continue
  if (!allSource.includes(`'${key}'`)) {
    warn('src/translations.json', `"${key}" is not referenced anywhere in src/`)
  }
}

// ── 5. Every t('...') call site has something to resolve to ──────────────────
for (const [file, text] of Object.entries(source)) {
  for (const m of text.matchAll(/\bt\('([a-z0-9_]+)'\)/g)) {
    if (!translations[m[1]]) fail(file, `t('${m[1]}') has no entry in translations.json`)
  }
}

// ── 6. Colour goes through a token ───────────────────────────────────────────
// index.css defines the tokens and KinematicSketch.jsx carries deliberate
// canvas fallbacks for them (it reads the live values via getComputedStyle).
// Everywhere else, a literal colour means the dark sheet was forgotten.
const HEX_EXEMPT = new Set(['src/components/KinematicSketch.jsx'])
for (const [file, text] of Object.entries(source)) {
  if (HEX_EXEMPT.has(file)) continue
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    fail(file, `literal colour ${m[0]} — use a token from tailwind.config.js`)
  }
}

// ── 7. No opacity modifiers on token colours ─────────────────────────────────
// The Tailwind colours resolve to var(...), so `bg-paper/50` silently produces
// no background at all. Add a token instead.
const TOKENS = 'paper|surface|ink-3|ink-2|ink|rule-strong|rule|accent-wash|accent-ink|accent'
const OPACITY = new RegExp(
  `\\b(?:bg|text|border|from|via|to|fill|stroke|ring|divide|outline|decoration|shadow)-(?:${TOKENS})\\/\\d+`,
  'g',
)
for (const [file, text] of Object.entries(source)) {
  for (const m of text.matchAll(OPACITY)) {
    fail(file, `${m[0]} — token colours are var(...) and ignore opacity modifiers`)
  }
}

// ── 8. Referenced project images (missing is allowed, by design) ─────────────
for (const { id, image } of projects) {
  if (image && !existsSync(join(ROOT, 'public', image))) {
    warn('public/projects', `"${id}" points at ${image}, which does not exist yet`)
  }
}

// ── 9. The share card resolves ───────────────────────────────────────────────
// A link preview is the first thing most readers see, and it is the one part of
// the site nobody looks at while working on it: a card pointing at a file that
// isn't there fails silently, in someone else's chat window, weeks later.
const html = read('index.html')
const meta = (prop, attr = 'property') =>
  html.match(new RegExp(`<meta\\s+${attr}="${prop}"\\s+content="([^"]+)"`))?.[1] ?? null

const ogImage = meta('og:image')
const ogUrl = meta('og:url')
const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] ?? null

if (!ogImage) fail('index.html', 'no og:image — shared links preview without a card')
if (!ogUrl) fail('index.html', 'no og:url')
if (!canonical) fail('index.html', 'no canonical link')

for (const [name, value] of Object.entries({ 'og:image': ogImage, 'og:url': ogUrl, canonical })) {
  // Scrapers fetch these with no base document, so a relative path is dropped.
  if (value && !/^https:\/\//.test(value)) {
    fail('index.html', `${name} is "${value}" — must be an absolute https URL`)
  }
}

if (ogImage && ogUrl) {
  const origin = u => u.replace(/^(https:\/\/[^/]+).*$/, '$1')
  if (origin(ogImage) !== origin(ogUrl)) {
    fail('index.html', `og:image and og:url disagree on origin (${ogImage}, ${ogUrl})`)
  }
  const file = ogImage.replace(/^https:\/\/[^/]+/, '')
  if (!existsSync(join(ROOT, 'public', file))) {
    fail('index.html', `og:image points at ${file}, which is not in public/`)
  }
}

// ── 10. Project dates are dates ──────────────────────────────────────────────
// `date` renders verbatim in the row's left rail, so a stray format shows up on
// the page rather than throwing. Optional — a row without one is fine.
const DATE_SHAPE = /^\d{4}-\d{2}( → (\d{4}-)?(\d{2}|now))?$/
for (const { id, date } of projects) {
  if (date && !DATE_SHAPE.test(date)) {
    fail(
      'src/components/Projects.jsx',
      `project "${id}" has date "${date}" — expected e.g. "2025-06", "2025-06 → 08", "2025-06 → now"`,
    )
  }
}

// ── 11. The BOM cites rows that exist ────────────────────────────────────────
// About.jsx renders `PROJECT_REFS[id]` directly. A `usedIn` id that is not in
// the registry resolves to undefined and the table prints the literal word
// "undefined" in that cell — silently, on the page a recruiter reads. Removing
// a project is exactly when this happens, since the skills that cited it are
// three files away from the row being deleted.
const aboutSrc = source['src/components/About.jsx']
const skills = [
  ...(aboutSrc.match(/const SKILLS = \[([\s\S]*?)\n\]/)?.[1] ?? '').matchAll(
    /\{\s*name:\s*'([^']+)',\s*usedIn:\s*\[([^\]]*)\]\s*\}/g,
  ),
].map(m => ({
  name: m[1],
  usedIn: [...m[2].matchAll(/'([^']+)'/g)].map(x => x[1]),
}))

if (!skills.length) fail('src/components/About.jsx', 'no SKILLS entries parsed')
for (const { name, usedIn } of skills) {
  for (const id of usedIn) {
    if (!ids.includes(id)) {
      fail('src/components/About.jsx', `skill "${name}" cites "${id}", which is not a project`)
    }
  }
}

// ── 12. Every group heading starts a run that exists ─────────────────────────
// `GROUP_HEADINGS` in Projects.jsx is keyed by the project id that starts each
// run of the list. An id that is not in the registry — renamed, reordered into
// the first run, or deleted — does not throw: the cut simply never happens and
// the rows merge into the run above under the wrong heading. The page still
// renders, so nothing but this catches it.
const groupHeadings = [
  ...(projectsSrc.match(/const GROUP_HEADINGS = \{([\s\S]*?)\n\}/)?.[1] ?? '').matchAll(
    /^\s*(\w+):\s*'([^']+)'/gm,
  ),
].map(m => ({ id: m[1], key: m[2] }))

if (!groupHeadings.length) fail('src/components/Projects.jsx', 'no GROUP_HEADINGS entries parsed')
for (const { id, key } of groupHeadings) {
  if (!ids.includes(id)) {
    fail(
      'src/components/Projects.jsx',
      `GROUP_HEADINGS starts a run at "${id}", which is not a project`,
    )
  }
  // The first row can't start a run — its heading would sit above the whole
  // list and read as the heading for rows it does not cover.
  if (ids[0] === id) {
    fail('src/components/Projects.jsx', `GROUP_HEADINGS starts a run at "${id}", the first row`)
  }
  if (!translations[key]) {
    fail('src/components/Projects.jsx', `GROUP_HEADINGS uses "${key}", which has no translation`)
  }
}

// ── 13. Detail panels are complete ───────────────────────────────────────────
// A row with figures renders a panel, and every string in it resolves through
// `t()`, which returns the key itself when it misses. So a forgotten caption
// does not throw — it prints `proj_speaker_fig_parts` on the page, in the panel
// a reader opened on purpose. The figure files are a warning rather than an
// error, matching how a missing row image is treated.
for (const { id, figures, link, video } of projects) {
  if (!figures.length && !video) continue

  // The row's stretched hit area can belong to a link or to the toggle, not
  // both, so `ProjectRow` prefers the link — and the figures then render
  // nowhere at all. Nothing about that is visible on the page: the row looks
  // exactly like any other linked row.
  if (link) {
    fail(
      'src/components/Projects.jsx',
      `project "${id}" has both figures and a link — the panel would never open`,
    )
  }
  if (!translations[`${id}_detail`]) {
    fail('src/translations.json', `project "${id}" has figures but no "${id}_detail" key`)
  }
  for (const { src, key } of figures) {
    if (!translations[key]) {
      fail('src/translations.json', `figure "${src}" maps to missing key "${key}"`)
    }
    if (!existsSync(join(ROOT, 'public', src))) {
      warn('public/projects', `"${id}" figure points at ${src}, which does not exist yet`)
    }
  }

  // The video is held to a stricter standard than the stills. A figure that
  // isn't there yet removes itself; a <video> with a missing src renders as an
  // empty frame with a dead control bar, and a missing poster leaves that frame
  // blank until someone presses play on nothing.
  if (video) {
    if (!translations[video.key]) {
      fail('src/translations.json', `video on "${id}" maps to missing key "${video.key}"`)
    }
    // A malformed `object-position` is not an error to the browser — it drops
    // the declaration and silently falls back to centring, which on a 9:16 clip
    // in a 16:10 frame crops the subject out rather than looking broken.
    if (video.position && !/^\d{1,3}% \d{1,3}%$/.test(video.position)) {
      fail(
        'src/components/Projects.jsx',
        `video on "${id}" has position "${video.position}" — expected e.g. "50% 36%"`,
      )
    }
    for (const [field, path] of [
      ['src', video.src],
      ['poster', video.poster],
    ]) {
      if (!path) {
        fail('src/components/Projects.jsx', `video on "${id}" has no ${field}`)
      } else if (!existsSync(join(ROOT, 'public', path))) {
        fail('public/projects', `"${id}" video ${field} points at ${path}, which does not exist`)
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const show = (list, label) => {
  if (!list.length) return
  console.log(`\n${label}`)
  for (const { file, msg } of list) console.log(`  ${file}\n    ${msg}`)
}

show(warnings, `${warnings.length} warning(s)`)
show(errors, `${errors.length} error(s)`)

if (errors.length) {
  console.log(`\n✗ check failed — ${errors.length} error(s)\n`)
  process.exit(1)
}
console.log(
  `\n✓ check passed — ${projects.length} projects, ${Object.keys(translations).length} translation keys` +
    (warnings.length ? `, ${warnings.length} warning(s)` : '') +
    '\n',
)
