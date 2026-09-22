import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { Project } from '../models/Project.js'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

const TAG_LABEL_KEYS = {
  robotics: 'projects_tag_robotics',
  mechanical: 'projects_tag_mechanical',
  electronics: 'projects_tag_electronics',
  software: 'projects_tag_software',
  firmware: 'projects_tag_firmware',
  fabrication: 'projects_tag_fabrication',
}

// Ordered by how much robotics is in them, not by date — the list is read top
// down and the first two rows are what the section is about.
const PROJECTS = [
  // Internship work at MUJIN. The deployed code is on an internal GitLab, so
  // this was the one row with nowhere to go; it now points at the public
  // write-up repository instead. Rows with no link are still supported and
  // still render correctly — see ProjectRow — but no row exercises that path
  // any more, so check it by hand if you change how a row links.
  new Project({
    id: 'proj_humanoid',
    tags: ['robotics', 'software'],
    github: 'https://github.com/yammmyu/MUJIN_Internship_Summer2026',
    image: '/projects/proj_humanoid.jpg',
  }),
  new Project({
    id: 'proj_slam',
    tags: ['robotics', 'mechanical', 'software'],
    github: 'https://github.com/yammmyu/YanyuChen_CDE2310_Project',
    image: '/projects/proj_slam.jpg',
  }),
  new Project({
    id: 'proj_pcb',
    tags: ['robotics', 'electronics'],
    github: 'https://github.com/nusrobomaster-comp/PCB27',
    image: '/projects/proj_pcb.jpg',
  }),
  new Project({
    id: 'proj_aimbot',
    tags: ['robotics', 'mechanical', 'electronics'],
    github: 'https://github.com/yammmyu/Moving_Aimbot_Target',
    image: '/projects/proj_aimbot.jpg',
  }),
  new Project({
    id: 'proj_arm',
    tags: ['robotics', 'mechanical', 'firmware'],
    github: 'https://github.com/yanyuc/robotic-arm',
    image: '/projects/proj_arm.jpg',
  }),
  // The two bench builds are in the order they were made, not by subject, and
  // that is the whole reason they sit together. The panel's wiring failed
  // because he could not solder; the speaker is where he learned to. Read the
  // other way round, or split apart, they are two hobby rows.
  new Project({
    id: 'proj_lightpanel',
    tags: ['mechanical', 'electronics', 'fabrication'],
    image: '/projects/proj_lightpanel.jpg',
  }),
  new Project({
    id: 'proj_speaker',
    tags: ['electronics', 'mechanical', 'fabrication'],
    date: '2024-11',
    // Built from a published tutorial, so the row cites it. See `reference` in
    // models/Project.js for why this is not `github`.
    reference: 'https://www.youtube.com/watch?v=a43LXqRwQC8',
    image: '/projects/proj_speaker.jpg',
  }),
  new Project({
    id: 'bloomcraft',
    tags: ['software'],
    github: 'https://github.com/yammmyu/bloomcraft',
    image: '/projects/bloomcraft.jpg',
  }),
  new Project({
    id: 'proj_portfolio',
    tags: ['software'],
    github: 'https://github.com/yammmyu/engineering-portfolio',
  }),
]

// The registry is one list read top down, cut into runs by the row that starts
// each one. The first run takes no heading — the section heading is its
// heading.
//
// It was a single `FURTHER_WORK_FROM` constant when there were two runs. A
// second constant would have worked and a third would not: the reader of the
// code has to hold the order of the constants and the order of the array in
// their head at once, and nothing makes them agree. Keyed by the id that starts
// the run, the cut is stated in one place and the array stays the only thing
// that decides sequence.
//
// Reference numbers are unaffected by any of this — they come from the registry
// index, so they stay continuous across a cut and a row keeps its P-NN when a
// group moves.
const GROUP_HEADINGS = {
  // Where the robotics list stops arguing its case: hardware he designed and
  // made by hand, which is a different claim from the rows above and should not
  // be read as a weaker version of them.
  proj_lightpanel: 'projects_bench_heading',
  // Real work, but a reader three rows deep shouldn't have to weigh a florist
  // assistant against a sentry's slip-ring boards to find the end of the list.
  bloomcraft: 'projects_further_heading',
}

// Ordered by precedence. A row's own demo outranks its own code, and both
// outrank where the work came from — see `reference` in models/Project.js.
const LINK_KINDS = [
  { field: 'demo', labelKey: 'projects_link_demo' },
  { field: 'github', labelKey: 'projects_link_github' },
  { field: 'reference', labelKey: 'projects_link_reference' },
]

/**
 * Row reference for a project id — `P-03`. The BOM in About.jsx cites rows by
 * these, and the numbering comes from this array's order, so it is derived here
 * rather than written out twice and left to drift the next time a row moves.
 */
export const PROJECT_REFS = Object.fromEntries(
  PROJECTS.map((project, i) => [project.id, `P-${String(i + 1).padStart(2, '0')}`]),
)

/**
 * Detail view for a row. The whole row is one stretched link, so this stays
 * unpositioned — a `relative` figure would paint over the link's hit area and
 * swallow the click.
 *
 * A missing file reports up to the row rather than returning null from here.
 * Removing only itself left the row's whole right-hand column empty: the marker
 * that tells a reader the row goes somewhere lives in the *other* branch of the
 * same ternary, so three rows pointing at screenshots that don't exist yet
 * rendered as if they had no link at all.
 */
function ProjectFigure({ src, alt, number, marker, onFail }) {
  const t = useTranslation()

  return (
    <figure>
      <div className="overflow-hidden border border-rule-strong bg-surface">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={onFail}
          className="fig-zoom aspect-[16/10] w-full object-cover"
        />
      </div>
      <figcaption className="mt-2 flex items-baseline justify-between gap-3">
        <span className="label">
          {t('projects_fig_label')} {number}
        </span>
        {marker && (
          <span
            aria-hidden="true"
            className="arrow-slide label hidden transition-colors duration-200 group-hover:text-accent-ink lg:inline-block"
          >
            {marker}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

function ProjectRow({ project, index }) {
  const t = useTranslation()
  const number = String(index + 1).padStart(2, '0')
  const ref = `P-${number}`
  // Held here rather than inside the figure so the row can fall back to the
  // link marker when the image is missing — see ProjectFigure.
  const [figureFailed, setFigureFailed] = React.useState(false)
  const showFigure = Boolean(project.image) && !figureFailed
  // The row highlighted on hover but only a link in the far corner was
  // clickable. The primary link now owns the whole row via a stretched
  // pseudo-element, so what lights up is what you can press. The title is the
  // anchor text, so the accessible name is the project — not "github".
  //
  // Each link carries the marker naming what it is. The second slot used to be
  // github by construction and said so in the JSX; with a third kind that was
  // one row away from labelling a tutorial "GITHUB ↗".
  const links = LINK_KINDS.filter(kind => project[kind.field]).map(kind => ({
    href: project[kind.field],
    marker: `${t(kind.labelKey)} ↗`,
  }))
  const [primary, ...secondary] = links

  return (
    <li className="group relative border-b border-rule">
      {/* A row with nowhere to go doesn't take the hover wash. Lighting up a
          row that can't be pressed is the same broken promise as the corner-only
          link above, in the other direction. */}
      <div
        className={`grid grid-cols-12 items-baseline gap-x-6 gap-y-4 px-2 py-6 transition-colors duration-200 sm:px-4 sm:py-7 ${
          primary ? 'group-hover:bg-accent-wash' : ''
        }`}
      >
        {/* Reference and date, stacked as a drawing's left rail. Inline on a
            phone, where a two-line rail above every title costs more than the
            column alignment is worth. */}
        <div className="col-span-12 flex items-baseline gap-3 sm:col-span-2 sm:block">
          <span
            className={`label inline-block transition-colors duration-200 ${
              primary ? 'row-mark group-hover:text-accent-ink' : ''
            }`}
          >
            {ref}
          </span>
          {project.date && <span className="label sm:mt-1.5 sm:block">{project.date}</span>}
        </div>

        {/* Everything about the project sits in one column at a readable
            measure. Spreading it across the full 78rem sheet put the title and
            its link 1200px apart and read as two unrelated things. */}
        <div className="col-span-12 max-w-measure sm:col-span-10 lg:col-span-6">
          <h3 className="font-display font-wide text-lg font-semibold leading-snug text-ink sm:text-xl">
            {primary ? (
              <a
                href={primary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="after:absolute after:inset-0 after:content-['']"
              >
                {t(project.titleKey)}
              </a>
            ) : (
              t(project.titleKey)
            )}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{t(project.descKey)}</p>
          {/* Tags are annotation, not control. Boxed, they sat at the same
              weight as the language toggle and read as filter chips on a list
              that has no filter — and the only thing actually pressable in the
              row is the row. Set as one line of marks, they say what the
              project is made of without promising a click. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label">
              {project.tags.map(tag => t(TAG_LABEL_KEYS[tag])).join(' · ')}
            </span>
            {/* A second destination can't nest inside the row link, so it is
                lifted above the stretched hit area. */}
            {secondary.map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink relative z-10 font-mono text-[11px] font-medium uppercase tracking-label"
              >
                {link.marker}
              </a>
            ))}
            {/* Without a hover state to reveal it, the row needs to say out
                loud that it goes somewhere. */}
            {primary && <span className="link-ink label text-ink lg:hidden">{primary.marker}</span>}
          </div>
        </div>

        {/* The far edge carries either a detail view or, failing that, a mark.
            Both read as an affordance without needing to sit beside the thing
            they belong to.

            The row is baseline-aligned for its text; a figure has no useful
            baseline to share, so it hangs from the top of the row instead. */}
        {showFigure ? (
          // Capped and pushed to the sheet edge. Given the full four columns the
          // figure grew to ~400px, which set the height of every row that had
          // one and turned eight rows into three screens of scrolling. This is a
          // detail view on a drawing, not a card.
          <div className="col-span-12 mt-2 self-start sm:col-span-10 sm:col-start-3 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:max-w-[17rem] lg:justify-self-end">
            <ProjectFigure
              src={project.image}
              alt={t(project.titleKey)}
              number={number}
              marker={primary ? primary.marker : null}
              onFail={() => setFigureFailed(true)}
            />
          </div>
        ) : (
          primary && (
            <div className="col-span-12 hidden lg:col-span-4 lg:block lg:text-right">
              <span
                aria-hidden="true"
                className="arrow-slide label inline-block transition-colors duration-200 group-hover:text-accent-ink"
              >
                {primary.marker}
              </span>
            </div>
          )
        )}
      </div>
    </li>
  )
}

/**
 * Cuts the registry into runs at the rows named in GROUP_HEADINGS, newest cut
 * last. Each run carries the registry index of its first row so `ProjectRow`
 * still numbers from the one array — the split is a heading, not a reordering.
 *
 * A run is dropped if it is empty, so naming a heading for a row that has since
 * been deleted costs a stray heading over an empty list rather than a crash.
 * `npm run check` fails on that id before it ever renders.
 */
function groupRows(projects) {
  const runs = [{ headingKey: null, start: 0, items: [] }]

  projects.forEach((project, i) => {
    const headingKey = GROUP_HEADINGS[project.id]
    if (headingKey) runs.push({ headingKey, start: i, items: [] })
    runs[runs.length - 1].items.push(project)
  })

  return runs.filter(run => run.items.length)
}

export default function Projects() {
  const t = useTranslation()
  const count = String(PROJECTS.length).padStart(2, '0')
  const groups = groupRows(PROJECTS)

  return (
    <section id="projects" className="py-20 sm:py-28">
      <Sheet>
        <SectionHeader
          sheet="02"
          title={t('projects_heading')}
          meta={`${count} ${t('projects_items_label')}`}
        />

        <Reveal>
          <p className="mb-8 max-w-measure text-[15px] leading-relaxed text-ink-2">
            {t('projects_subheading')}
          </p>

          {groups.map(run => (
            <React.Fragment key={run.headingKey ?? 'lead'}>
              {run.headingKey && <h3 className="label mb-3 mt-12">{t(run.headingKey)}</h3>}
              <ol className="border-t border-rule-strong">
                {run.items.map((project, i) => (
                  <ProjectRow key={project.id} project={project} index={run.start + i} />
                ))}
              </ol>
            </React.Fragment>
          ))}
        </Reveal>
      </Sheet>
    </section>
  )
}
