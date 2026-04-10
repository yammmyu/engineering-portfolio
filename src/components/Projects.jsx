import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'

const TAG_STYLES = {
  robotics:   'bg-blue-50   border-blue-200   text-blue-700',
  mechanical: 'bg-amber-50  border-amber-200  text-amber-700',
  software:   'bg-green-50  border-green-200  text-green-700',
  embedded:   'bg-purple-50 border-purple-200 text-purple-700',
}

const TAG_LABEL_KEYS = {
  robotics:   'projects_tag_robotics',
  mechanical: 'projects_tag_mechanical',
  software:   'projects_tag_software',
  embedded:   'projects_tag_embedded',
}

const PROJECTS = [
  {
    id: 'proj_arm',
    titleKey: 'proj_arm_title',
    descKey: 'proj_arm_desc',
    tags: ['robotics', 'mechanical'],
    github: 'https://github.com/yanyuc/robotic-arm',
    demo: null,
  },
  {
    id: 'proj_slam',
    titleKey: 'proj_slam_title',
    descKey: 'proj_slam_desc',
    tags: ['robotics', 'software'],
    github: 'https://github.com/yanyuc/slam-ws',
    demo: null,
  },
  {
    id: 'proj_balancer',
    titleKey: 'proj_balancer_title',
    descKey: 'proj_balancer_desc',
    tags: ['embedded', 'mechanical'],
    github: 'https://github.com/yanyuc/self-balancing-bot',
    demo: null,
  },
  {
    id: 'proj_portfolio',
    titleKey: 'proj_portfolio_title',
    descKey: 'proj_portfolio_desc',
    tags: ['software'],
    github: 'https://github.com/yanyuc/engineering-portfolio',
    demo: null,
  },
]

function ProjectCard({ project }) {
  const t = useTranslation()

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm
                        flex flex-col gap-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">
        {t(project.titleKey)}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">
        {t(project.descKey)}
      </p>

      <div className="flex flex-wrap gap-2">
        {project.tags.map(tag => (
          <span
            key={tag}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${TAG_STYLES[tag]}`}
          >
            {t(TAG_LABEL_KEYS[tag])}
          </span>
        ))}
      </div>

      {(project.github || project.demo) && (
        <div className="flex gap-4 pt-1 border-t border-gray-100">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t('projects_link_github')} →
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t('projects_link_demo')} →
            </a>
          )}
        </div>
      )}
    </article>
  )
}

export default function Projects() {
  const t = useTranslation()

  return (
    <section id="projects" className="bg-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('projects_heading')}
        </h2>
        <p className="text-gray-500 mb-12">{t('projects_subheading')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PROJECTS.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
