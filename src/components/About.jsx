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
// Only cite what a project description actually states. Several of these are
// surely used more widely — P-01 is a robotics deployment, P-04 a mechanical
// build — but which tool did what on a given project is the author's fact to
// give, not one to infer from a tag. A dash is the honest entry until he says
// otherwise, and it prompts the question instead of answering it wrongly.
const SKILLS = [
  { name: 'SolidWorks / CAD', usedIn: ['proj_slam', 'proj_arm', 'proj_lightpanel'] },
  { name: 'FEA & Simulation', usedIn: [] },
  // The table had no row for making the thing, only for designing and
  // programming it — so two printers, a laser cutter and a soldering iron were
  // invisible on a page whose whole argument is that he builds. The bench rows
  // are what it cites because they are what their descriptions state; P-02 and
  // P-04 are surely fabricated too, and stay uncited until he says so.
  { name: '3D Printing / Fabrication', usedIn: ['proj_lightpanel', 'proj_speaker'] },
  { name: 'Soldering / Wiring', usedIn: ['proj_speaker'] },
  { name: 'ROS / ROS2', usedIn: ['proj_slam'] },
  { name: 'Arduino / STM32', usedIn: [] },
  { name: 'Python', usedIn: ['proj_arm'] },
  { name: 'C / C++', usedIn: [] },
  { name: 'MATLAB', usedIn: [] },
  { name: 'Git', usedIn: [] },
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
                        {skill.usedIn.length
                          ? skill.usedIn.map(id => PROJECT_REFS[id]).join(', ')
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
