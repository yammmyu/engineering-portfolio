import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'

const SKILLS = [
  'SolidWorks / CAD',
  'ROS / ROS2',
  'Python',
  'C / C++',
  'Arduino / STM32',
  'FEA & Simulation',
  'MATLAB',
  'Git',
]

export default function About() {
  const t = useTranslation()

  return (
    <section id="about" className="bg-gray-50 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          {t('about_heading')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <p className="text-gray-600 leading-relaxed">{t('about_body_1')}</p>
            <p className="text-gray-600 leading-relaxed">{t('about_body_2')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              {t('about_skills_heading')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 text-gray-700 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
