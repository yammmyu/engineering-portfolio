import React, { useState, useEffect } from 'react'
import { useLanguage, useTranslation } from '../context/LanguageContext.jsx'

const NAV_LINKS = [
  { key: 'nav_about',    href: '#about' },
  { key: 'nav_projects', href: '#projects' },
  { key: 'nav_contact',  href: '#contact' },
]

export default function Navbar() {
  const t = useTranslation()
  const { toggleLang } = useLanguage()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="text-sm font-semibold tracking-wide text-gray-900">
          Yanyu Chen
        </a>

        <div className="flex items-center gap-6">
          <ul className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <li key={link.key}>
                <a
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={toggleLang}
            className="text-sm font-medium px-3 py-1 rounded-md border border-gray-200
                       text-gray-600 hover:text-gray-900 hover:border-gray-400
                       transition-colors"
          >
            {t('nav_lang_toggle')}
          </button>
        </div>
      </nav>
    </header>
  )
}
