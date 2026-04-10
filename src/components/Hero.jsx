import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'

export default function Hero() {
  const t = useTranslation()

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16"
    >
      <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">
        {t('hero_greeting')}
      </p>
      <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        {t('hero_name')}
      </h1>
      <p className="text-lg sm:text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
        {t('hero_tagline')}
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <a
          href="#projects"
          className="px-6 py-3 bg-accent text-white text-sm font-semibold
                     rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('hero_cta_projects')}
        </a>
        <a
          href="#contact"
          className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-semibold
                     rounded-lg hover:border-gray-500 hover:text-gray-900 transition-colors"
        >
          {t('hero_cta_contact')}
        </a>
      </div>
    </section>
  )
}
