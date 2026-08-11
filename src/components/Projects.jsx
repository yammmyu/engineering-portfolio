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
}

// Ordered by how much robotics is in them, not by date — the list is read top
// down and the first two rows are what the section is about.
const PROJECTS = [
  // Internship work at MUJIN. The code is on an internal GitLab, so this row
  // carries no link — the first one that doesn't. See ProjectRow for how a
  // link-less row renders.
  new Project({
    id: 'proj_humanoid',
    tags: ['robotics', 'software'],
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
    id: 'proj_controller',
    tags: ['robotics', 'firmware'],
    github: 'https://github.com/yammmyu/Engineer_Custom_Controller',
    image: '/projects/proj_controller.jpg',
  }),
  new Project({
    id: 'proj_arm',
    tags: ['robotics', 'mechanical', 'firmware'],
    github: 'https://github.com/yanyuc/robotic-arm',
    image: '/projects/proj_arm.jpg',
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

// Where the robotics list stops arguing its case. The rows from here down are
// real work, but a reader three rows deep shouldn't have to weigh a florist
// assistant against a sentry's slip-ring boards to find the end of the list.
const FURTHER_WORK_FROM = 'bloomcraft'

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
  const primary = project.demo || project.github
  const secondary = project.demo && project.github ? project.github : null
  const marker = `${t(project.demo ? 'projects_link_demo' : 'projects_link_github')} ↗`

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
                href={primary}
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
            {secondary && (
              <a
                href={secondary}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink relative z-10 font-mono text-[11px] font-medium uppercase tracking-label"
              >
                {t('projects_link_github')} ↗
              </a>
            )}
            {/* Without a hover state to reveal it, the row needs to say out
                loud that it goes somewhere. */}
            {primary && <span className="link-ink label text-ink lg:hidden">{marker}</span>}
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
              marker={primary ? marker : null}
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
                {marker}
              </span>
            </div>
          )
        )}
      </div>
    </li>
  )
}

export default function Projects() {
  const t = useTranslation()
  const count = String(PROJECTS.length).padStart(2, '0')
  // One registry, two lists. The split is a heading, not a reordering — the
  // reference numbers stay continuous because they come from the array index.
  const split = PROJECTS.findIndex(project => project.id === FURTHER_WORK_FROM)
  const robotics = split === -1 ? PROJECTS : PROJECTS.slice(0, split)
  const further = split === -1 ? [] : PROJECTS.slice(split)

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

          <ol className="border-t border-rule-strong">
            {robotics.map((project, i) => (
              <ProjectRow key={project.id} project={project} index={i} />
            ))}
          </ol>

          {further.length > 0 && (
            <>
              <h3 className="label mb-3 mt-12">{t('projects_further_heading')}</h3>
              <ol className="border-t border-rule-strong">
                {further.map((project, i) => (
                  <ProjectRow key={project.id} project={project} index={split + i} />
                ))}
              </ol>
            </>
          )}
        </Reveal>
      </Sheet>
    </section>
  )
}
