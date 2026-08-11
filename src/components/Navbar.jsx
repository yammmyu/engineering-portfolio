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
  const [active, setActive] = useState(null)
  const progressRef = useRef(null)

  // Which sheet is on the table. Read from the same rAF as the progress bar
  // rather than an observer, so the two never disagree by a frame.
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

      // The section crossing a line a third down the viewport, so a heading
      // becomes "current" as it settles into reading position rather than the
      // instant its top edge clears the chrome.
      const line = window.innerHeight * 0.34
      let current = null
      for (const link of NAV_LINKS) {
        const el = document.querySelector(link.href)
        if (el && el.getBoundingClientRect().top <= line) current = link.href
      }
      // The last section can never reach the line on a short page; if the
      // scroll is at the end, it is what you are looking at.
      if (ratio > 0.99) current = NAV_LINKS[NAV_LINKS.length - 1].href
      setActive(current)
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
        scrolled ? 'chrome border-b border-rule' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-sheet items-center justify-between gap-4 px-6 md:px-10">
        {/* Below sm the wordmark drops to just the register mark — the full
            name is the first thing in the hero anyway, and keeping it here
            wraps the bar onto two lines. The padding is what makes it a real
            target; the negative margin keeps it optically on the gutter. */}
        <a
          href="#hero"
          aria-label={t('hero_name')}
          className="-m-3 flex shrink-0 items-center gap-2.5 p-3"
        >
          <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="hidden whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-label text-ink sm:inline">
            {t('hero_name')}
          </span>
        </a>

        <div className="flex items-center gap-5 sm:gap-7">
          <ul className="flex items-center gap-4 sm:gap-7">
            {NAV_LINKS.map(link => {
              const on = active === link.href
              return (
                <li key={link.key}>
                  {/* The accent marks the current sheet as a wash behind the
                      item, not as its text colour — an amber dark enough to be
                      legible at 11px reads as brown. The wash follows the link
                      itself so it survives the sheet number being dropped on
                      narrow screens. */}
                  <a
                    href={link.href}
                    aria-current={on ? 'true' : undefined}
                    className={`group -mx-1.5 -my-1 flex items-baseline gap-1.5 px-1.5 py-1 font-mono text-[11px] font-medium uppercase tracking-label transition-colors duration-200 hover:text-ink ${
                      on ? 'bg-accent-wash text-ink' : 'text-ink-2'
                    }`}
                  >
                    <span
                      className={`hidden transition-colors duration-200 group-hover:text-ink md:inline ${
                        on ? 'text-ink' : 'text-ink-3'
                      }`}
                    >
                      {link.sheet}
                    </span>
                    {t(link.key)}
                  </a>
                </li>
              )
            })}
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
                className={`px-2.5 py-2 font-mono text-[11px] font-medium uppercase tracking-label transition-colors duration-200 ${
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

      {/* Scroll edge: the sheet dissolves into the chrome rather than meeting
          it at a hard line. Sits below the bar, outside its own background. */}
      <div
        aria-hidden="true"
        className={`chrome-edge pointer-events-none absolute inset-x-0 top-full h-5 ${
          scrolled ? 'chrome-edge-in' : ''
        }`}
      />
    </header>
  )
}
