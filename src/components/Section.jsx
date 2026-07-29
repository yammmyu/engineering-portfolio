import React from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { useTranslation } from '../context/LanguageContext.jsx'

/**
 * Sheet header: number, title, optional right-hand meta, and a rule that
 * draws across as the section comes into view.
 */
export function SectionHeader({ sheet, title, meta }) {
  const t = useTranslation()
  const [ref, shown] = useReveal()

  return (
    <header ref={ref} className="mb-10 sm:mb-14">
      <div className="flex items-baseline gap-4 sm:gap-6">
        <span className="label shrink-0">
          {t('sheet_label')} {sheet}
        </span>
        <h2 className="font-display font-expanded text-2xl font-bold uppercase tracking-[0.005em] sm:text-3xl">
          {title}
        </h2>
        {meta && <span className="label ml-auto hidden shrink-0 sm:block">{meta}</span>}
      </div>
      <div
        className={`mt-4 h-px origin-left bg-rule-strong rule-draw ${shown ? 'rule-draw-in' : ''}`}
      />
    </header>
  )
}

/** Fades and lifts its children in on scroll. `delay` staggers siblings. */
export function Reveal({ children, delay = 0, className = '' }) {
  const [ref, shown] = useReveal()

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/** Standard sheet gutter. */
export function Sheet({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-sheet px-6 md:px-10 ${className}`}>{children}</div>
}
