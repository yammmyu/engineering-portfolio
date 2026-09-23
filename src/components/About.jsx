import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'
import { PROJECT_REFS } from './Projects.jsx'

// Bill of materials. A real BOM says where each part is used, and that is the
// column this table was missing: it previously repeated the project tags, so a
// reader learned that MATLAB is "software" and nothing else. Citing the rows
// turns a list of claims into an index into the evidence — and a skill with no
// row against it is a question worth being asked.
//
// `usedIn` holds project ids; the P-NN reference comes from the registry order
// in Projects.jsx so it can never disagree with the list itself.
//
// Which tool did what on a given project is the author's fact to give, never
// one to infer from a tag or a description. Most of these rows were a dash
// until he named the projects himself; the render still falls back to a dash
// rather than an empty cell, so a new skill can be added before he has said
// where it was used, and the gap reads as a question rather than an omission.
const SKILLS = [
  {
    name: 'SolidWorks / CAD',
    usedIn: ['proj_engineer_arm', 'proj_slam', 'proj_arm', 'proj_lightpanel'],
  },
  { name: 'FEA & Simulation', usedIn: ['proj_engineer_arm', 'proj_arm'] },
  // The table had no row for making the thing, only for designing and
  // programming it — so printing, laser cutting and soldering were invisible on
  // a page whose whole argument is that he builds. Printing now cites the
  // competition and lab builds as well as the bench ones, on the author's say —
  // the bench rows are the only ones whose descriptions state it outright.
  {
    name: '3D Printing / Fabrication',
    usedIn: [
      'proj_engineer_arm',
      'proj_arm',
      'proj_aimbot',
      'proj_slam',
      'proj_lightpanel',
      'proj_speaker',
    ],
  },
  { name: 'Soldering / Wiring', usedIn: ['proj_speaker'] },
  { name: 'ROS / ROS2', usedIn: ['proj_slam', 'proj_arm'] },
  { name: 'Arduino / STM32', usedIn: ['proj_engineer_arm', 'proj_arm', 'proj_aimbot'] },
  { name: 'Python', usedIn: ['proj_arm', 'proj_slam'] },
  { name: 'C / C++', usedIn: ['proj_humanoid', 'proj_arm'] },
  { name: 'Git', usedIn: ['proj_humanoid', 'proj_slam'] },
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
                    {/* Right-aligned so the column reads against the sheet edge
                        instead of floating in the gap the wide table leaves. */}
                    <th scope="col" className="label py-2.5 text-right font-normal">
                      {t('bom_col_used_in')}
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
                      {/* An em dash rather than an empty cell: on a drawing a
                          blank field is an omission, a dash is a statement. */}
                      <td className="tnum py-3 text-right font-mono text-[11px] text-ink-2">
                        {/* Sorted, not printed in the order the array happens to
                            be written. Reordering the registry renumbers every
                            row, and a cell that then reads "P-02, P-05, P-03"
                            looks like a mistake in a table whose whole job is
                            to be checkable. The refs are zero-padded, so a
                            plain sort is numeric. */}
                        {skill.usedIn.length
                          ? skill.usedIn
                              .map(id => PROJECT_REFS[id])
                              .sort()
                              .join(', ')
                          : '—'}
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
