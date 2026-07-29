import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

// Bill of materials. Categories reuse the project tag keys so the two
// sections stay described in the same vocabulary.
const SKILLS = [
  { name: 'SolidWorks / CAD', categoryKey: 'projects_tag_mechanical' },
  { name: 'FEA & Simulation', categoryKey: 'projects_tag_mechanical' },
  { name: 'ROS / ROS2', categoryKey: 'projects_tag_robotics' },
  { name: 'Arduino / STM32', categoryKey: 'projects_tag_firmware' },
  { name: 'Python', categoryKey: 'projects_tag_software' },
  { name: 'C / C++', categoryKey: 'projects_tag_software' },
  { name: 'MATLAB', categoryKey: 'projects_tag_software' },
  { name: 'Git', categoryKey: 'projects_tag_software' },
]

export default function About() {
  const t = useTranslation()

  return (
    <section id="about" className="bg-surface py-20 sm:py-28">
      <Sheet>
        <SectionHeader sheet="01" title={t('about_heading')} />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="label mb-4">{t('about_notes_heading')}</p>
            <div className="space-y-5 border-t border-rule pt-5">
              <p className="text-base leading-relaxed text-ink-2">{t('about_body_1')}</p>
              <p className="text-base leading-relaxed text-ink-2">{t('about_body_2')}</p>
            </div>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7">
            <p className="label mb-4">{t('about_skills_heading')}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] border-collapse text-left">
                <thead>
                  <tr className="border-y border-rule-strong">
                    <th scope="col" className="label w-12 py-2.5 pr-4 font-normal">
                      {t('bom_col_item')}
                    </th>
                    <th scope="col" className="label py-2.5 pr-4 font-normal">
                      {t('bom_col_designation')}
                    </th>
                    <th scope="col" className="label py-2.5 font-normal">
                      {t('bom_col_category')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SKILLS.map((skill, i) => (
                    <tr key={skill.name} className="border-b border-rule">
                      <td className="tnum py-3 pr-4 font-mono text-[11px] text-ink-3">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 pr-4 text-sm text-ink">{skill.name}</td>
                      <td className="py-3 font-mono text-[10px] uppercase tracking-label text-ink-2">
                        {t(skill.categoryKey)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </Sheet>
    </section>
  )
}
