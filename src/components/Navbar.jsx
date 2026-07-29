import React, { useState, useEffect, useRef } from 'react'
import { useLanguage, useTranslation } from '../context/LanguageContext.jsx'

const NAV_LINKS = [
  { key: 'nav_about', href: '#about', sheet: '01' },
  { key: 'nav_projects', href: '#projects', sheet: '02' },
  { key: 'nav_contact', href: '#contact', sheet: '03' },
]

export default function Navbar() {
  const t = useTranslation()
  const { lang, toggleLang } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    let raf = 0

    const update = () => {
      raf = 0
      const y = window.scrollY
      setScrolled(y > 8)
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(y / max, 1) : 0
      // Written straight to the element — setting a CSS variable here would
      // force a style recalc on every descendant.
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled ? 'border-b border-rule bg-paper' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-sheet items-center justify-between gap-4 px-6 md:px-10">
        {/* Below sm the wordmark drops to just the register mark — the full
            name is the first thing in the hero anyway, and keeping it here
            wraps the bar onto two lines. */}
        <a href="#hero" className="flex shrink-0 items-center gap-2.5">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="hidden whitespace-nowrap font-mono text-[11px] uppercase tracking-label text-ink sm:inline">
            {t('hero_name')}
          </span>
        </a>

        <div className="flex items-center gap-5 sm:gap-7">
          <ul className="flex items-center gap-4 sm:gap-7">
            {NAV_LINKS.map(link => (
              <li key={link.key}>
                <a
                  href={link.href}
                  className="group flex items-baseline gap-1.5 font-mono text-[11px] uppercase tracking-label text-ink-2 transition-colors duration-200 hover:text-ink"
                >
                  <span className="hidden text-ink-3 transition-colors duration-200 group-hover:text-accent md:inline">
                    {link.sheet}
                  </span>
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('nav_lang_aria')}
            className="btn-press flex shrink-0 border border-rule-strong"
          >
            {[
              { code: 'en', label: 'EN' },
              { code: 'zh', label: '中文' },
            ].map(opt => (
              <span
                key={opt.code}
                className={`px-2 py-1 font-mono text-[10px] uppercase tracking-label transition-colors duration-200 ${
                  lang === opt.code ? 'bg-ink text-paper' : 'text-ink-3'
                }`}
              >
                {opt.label}
              </span>
            ))}
          </button>
        </div>
      </nav>

      {/* Scroll position, read as a scale bar along the bottom of the title bar. */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="h-px origin-left scale-x-0 bg-accent"
      />
    </header>
  )
}
