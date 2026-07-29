import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import KinematicSketch from './KinematicSketch.jsx'
import { Sheet } from './Section.jsx'

const TITLE_BLOCK = [
  { labelKey: 'tb_role', valueKey: 'tb_role_value' },
  { labelKey: 'tb_focus', valueKey: 'tb_focus_value' },
  { labelKey: 'tb_status', valueKey: 'tb_status_value' },
  { labelKey: 'tb_lang', valueKey: 'tb_lang_value' },
]

export default function Hero() {
  const t = useTranslation()

  return (
    <section id="hero" className="flex min-h-[100svh] flex-col justify-center pb-12 pt-28">
      <Sheet>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span className="label">{t('hero_greeting')}</span>
            </p>

            <h1 className="mt-5 font-display font-expanded text-[clamp(2.75rem,8.5vw,6.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em]">
              {t('hero_name')}
            </h1>

            <p className="mt-6 max-w-measure text-base leading-relaxed text-ink-2 sm:text-lg">
              {t('hero_tagline')}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="btn-press group inline-flex items-center gap-2.5 bg-ink px-6 py-3.5 font-mono text-[11px] uppercase tracking-label text-paper hover:bg-accent hover:text-ink"
              >
                {t('hero_cta_projects')}
                <span aria-hidden="true" className="arrow-slide">
                  →
                </span>
              </a>
              <a
                href="#contact"
                className="btn-press inline-flex items-center border border-rule-strong px-6 py-3.5 font-mono text-[11px] uppercase tracking-label text-ink-2 hover:border-ink hover:text-ink"
              >
                {t('hero_cta_contact')}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <KinematicSketch />
          </div>
        </div>

        {/* Title block, as on a drawing sheet. */}
        <dl className="mt-14 grid grid-cols-2 border-l border-t border-rule sm:grid-cols-4">
          {TITLE_BLOCK.map(field => (
            <div key={field.labelKey} className="border-b border-r border-rule px-4 py-3.5">
              <dt className="label">{t(field.labelKey)}</dt>
              <dd className="mt-2 font-mono text-[11px] leading-snug text-ink">
                {t(field.valueKey)}
              </dd>
            </div>
          ))}
        </dl>
      </Sheet>
    </section>
  )
}
