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
  // Second on the robotics ordering, not fifth: a competition manipulator that
  // shipped, was tested to destruction, redesigned, and placed — the strongest
  // mechanical evidence on the sheet. Only the internship outranks it.
  new Project({
    id: 'proj_engineer_arm',
    tags: ['robotics', 'mechanical'],
    github: 'https://github.com/yammmyu/RM2026_Engineer_Arm',
    image: '/projects/proj_engineer_arm.jpg',
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
    github: 'https://github.com/yammmyu/Ybot',
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
    figures: [
      { src: '/projects/proj_lightpanel-sketch.jpg', key: 'proj_lightpanel_fig_sketch' },
      { src: '/projects/proj_lightpanel-cad.jpg', key: 'proj_lightpanel_fig_cad' },
      { src: '/projects/proj_lightpanel-printed.jpg', key: 'proj_lightpanel_fig_printed' },
    ],
  }),
  new Project({
    id: 'proj_speaker',
    tags: ['electronics', 'mechanical', 'fabrication'],
    image: '/projects/proj_speaker.jpg',
    figures: [
      { src: '/projects/proj_speaker-internals.jpg', key: 'proj_speaker_fig_internals' },
      { src: '/projects/proj_speaker-parts.jpg', key: 'proj_speaker_fig_parts' },
    ],
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

// Ordered by precedence: a row's own demo outranks its own code.
const LINK_KINDS = [
  { field: 'demo', labelKey: 'projects_link_demo' },
  { field: 'github', labelKey: 'projects_link_github' },
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

/**
 * The expanded half of a bench-build row: a longer account, then the views that
 * could not fit the row's own figure.
 *
 * It stays mounted while collapsed rather than rendering null, because the
 * height it animates to has to be measurable before it opens — and because a
 * panel that unmounts loses the scroll position of whatever is under it the
 * moment it shuts. `.disclosure` hides it from the tab order meanwhile.
 */
function DetailPanel({ project, number, id, open }) {
  const t = useTranslation()

  return (
    <div id={id} className={`disclosure ${open ? 'disclosure-open' : ''}`}>
      {/* The block is what separates an open panel from the rows above and
          below it, so it runs the full width of the row rather than sitting
          under the text column. `surface` is the sheet's existing inset colour
          — the About sheet and every figure frame are already on it — and it is
          lighter than `paper` on both sheets, so the panel reads the same way in
          either theme without a single branch. */}
      <div className="bg-surface">
        {/* The content stays indented to the row's text column, so the panel
            reads as that row opening up rather than as an unrelated block that
            happens to sit between two rows. */}
        <div className="grid grid-cols-12 px-2 pb-9 pt-8 sm:px-4">
          <div className="col-span-12 sm:col-span-10 sm:col-start-3">
            {t(project.detailKey)
              .split('\n')
              .map(paragraph => (
                <p
                  key={paragraph}
                  className="mt-3 max-w-measure text-sm leading-relaxed text-ink-2 first:mt-0"
                >
                  {paragraph}
                </p>
              ))}

            {/* Three across is the whole reason the panel exists: the row
                figure caps at 17rem, and a sketch or a CAD view is unreadable
                at that size. Here each frame gets ~330px. */}
            <ul className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {project.figures.map((figure, i) => (
                <li key={figure.src}>
                  <figure>
                    {/* `paper`, not `surface` like the row figure: the frame
                        sits on the panel's own surface block, and backing it in
                        the same colour would leave a figure that fails to load
                        as an empty patch of background. */}
                    <div className="overflow-hidden border border-rule-strong bg-paper">
                      <img
                        src={figure.src}
                        alt={t(figure.key)}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </div>
                    <figcaption className="label mt-2">
                      {t('projects_fig_label')} {number}.{i + 1} · {t(figure.key)}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
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
  // Each link carries the marker naming what it is, rather than the second slot
  // being github by construction and saying so in the JSX.
  const links = LINK_KINDS.filter(kind => project[kind.field]).map(kind => ({
    href: project[kind.field],
    marker: `${t(kind.labelKey)} ↗`,
  }))
  const [primary, ...secondary] = links

  // A row with extra views opens them in place instead of going anywhere. The
  // two are mutually exclusive by construction today and the JSX below assumes
  // it: the stretched hit area can only belong to one of them, and a row that
  // both navigates away and expands would have to pick which one a click means.
  const [open, setOpen] = React.useState(false)
  const expandable = !primary && project.hasDetail
  const panelId = `${project.id}-detail`
  // What the row promises. A link goes somewhere and says so with an arrow; a
  // panel opens here, and the sign is the affordance a reader already knows.
  const marker = primary
    ? primary.marker
    : expandable
      ? `${t(open ? 'projects_detail_hide' : 'projects_detail_show')} ${open ? '−' : '+'}`
      : null
  const pressable = Boolean(primary) || expandable

  return (
    <li className="border-b border-rule">
      {/* The group and the positioning stop at the row proper. Spanning the
          whole <li>, the title's stretched hit area covered the open panel too,
          so every click inside it shut the row — and hovering the panel washed
          a row the pointer had left. */}
      <div className="group relative">
      {/* A row with nowhere to go doesn't take the hover wash. Lighting up a
          row that can't be pressed is the same broken promise as the corner-only
          link above, in the other direction. */}
      <div
        className={`grid grid-cols-12 items-baseline gap-x-6 gap-y-4 px-2 py-6 transition-colors duration-200 sm:px-4 sm:py-7 ${
          pressable ? 'group-hover:bg-accent-wash' : ''
        }`}
      >
        {/* Reference and date, stacked as a drawing's left rail. Inline on a
            phone, where a two-line rail above every title costs more than the
            column alignment is worth. */}
        <div className="col-span-12 flex items-baseline gap-3 sm:col-span-2 sm:block">
          <span
            className={`label inline-block transition-colors duration-200 ${
              pressable ? 'row-mark group-hover:text-accent-ink' : ''
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
            ) : expandable ? (
              // The title is the control, exactly as it is the anchor on a
              // linked row, so the accessible name is the project rather than
              // "detail" — and the whole row is the hit area, so what lights up
              // on hover is still what you can press.
              <button
                type="button"
                onClick={() => setOpen(wasOpen => !wasOpen)}
                aria-expanded={open}
                aria-controls={panelId}
                className="text-left after:absolute after:inset-0 after:content-['']"
              >
                {t(project.titleKey)}
              </button>
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
            {marker && <span className="link-ink label text-ink lg:hidden">{marker}</span>}
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
              marker={marker}
              onFail={() => setFigureFailed(true)}
            />
          </div>
        ) : (
          marker && (
            <div className="col-span-12 hidden lg:col-span-4 lg:block lg:text-right">
              <span
                aria-hidden="true"
                className="arrow-slide label inline-block transition-colors duration-200 group-hover:text-accent-ink"
              >
                {marker}
              </span>
            </div>
          )
        )}
        </div>
      </div>

      {expandable && <DetailPanel project={project} number={number} id={panelId} open={open} />}
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
