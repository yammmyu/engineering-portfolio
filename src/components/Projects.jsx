import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { Project } from '../models/Project.js'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

const TAG_LABEL_KEYS = {
  robotics: 'projects_tag_robotics',
  mechanical: 'projects_tag_mechanical',
  software: 'projects_tag_software',
  firmware: 'projects_tag_firmware',
}

const PROJECTS = [
  new Project({
    id: 'proj_arm',
    tags: ['robotics', 'mechanical', 'firmware'],
    github: 'https://github.com/yanyuc/robotic-arm',
  }),
  new Project({
    id: 'proj_slam',
    tags: ['robotics', 'software'],
    github: 'https://github.com/Notchennie1/CDE2310_Group11',
  }),
  new Project({
    id: 'bloomcraft',
    tags: ['software'],
    github: 'https://github.com/yammmyu/bloomcraft',
  }),
  new Project({
    id: 'proj_portfolio',
    tags: ['software'],
    github: 'https://github.com/yanyuc/engineering-portfolio',
  }),
]

function ProjectRow({ project, index }) {
  const t = useTranslation()
  const ref = `P-${String(index + 1).padStart(2, '0')}`

  return (
    <li className="group border-b border-rule">
      <div className="grid grid-cols-12 gap-x-4 gap-y-4 px-2 py-7 transition-colors duration-200 group-hover:bg-accent-wash sm:px-4 sm:py-8">
        <div className="col-span-12 sm:col-span-2">
          <span className="label row-mark inline-block transition-colors duration-200 group-hover:text-accent">
            {ref}
          </span>
        </div>

        <div className="col-span-12 sm:col-span-7">
          <h3 className="font-display font-wide text-lg font-semibold leading-snug text-ink sm:text-xl">
            {t(project.titleKey)}
          </h3>
          <p className="mt-2.5 max-w-measure text-sm leading-relaxed text-ink-2">
            {t(project.descKey)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="border border-rule-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-ink-2"
              >
                {t(TAG_LABEL_KEYS[tag])}
              </span>
            ))}
          </div>
        </div>

        {project.hasLinks && (
          <div className="col-span-12 flex flex-wrap items-start gap-x-5 gap-y-2 sm:col-span-3 sm:justify-end">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink font-mono text-[11px] uppercase tracking-label"
              >
                {t('projects_link_github')} ↗
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink font-mono text-[11px] uppercase tracking-label"
              >
                {t('projects_link_demo')} ↗
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export default function Projects() {
  const t = useTranslation()
  const count = String(PROJECTS.length).padStart(2, '0')

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
            {PROJECTS.map((project, i) => (
              <ProjectRow key={project.id} project={project} index={i} />
            ))}
          </ol>
        </Reveal>
      </Sheet>
    </section>
  )
}
