import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

// `hidden` takes a row out of the rendered list without deleting it. The two
// résumé rows are parked this way at the author's request, temporarily — the
// keys, hrefs, and translations stay intact, so bringing them back is deleting
// one flag per row. Cutting the rows outright was the first instinct, but that
// also stranded contact_resume_*_label in translations.json and lost the hrefs.
const CONTACT_LINKS = [
  {
    labelKey: 'contact_email_label',
    href: 'mailto:yc.yanyuchen@gmail.com',
    display: 'yc.yanyuchen@gmail.com',
  },
  {
    labelKey: 'contact_linkedin_label',
    href: 'https://www.linkedin.com/in/yanyu-c/',
    display: 'linkedin.com/in/yanyu-c',
  },
  {
    labelKey: 'contact_github_label',
    href: 'https://github.com/yammmyu',
    display: 'github.com/yammmyu',
  },
  {
    labelKey: 'contact_resume_en_label',
    href: '/resume-en.pdf',
    display: 'resume-en.pdf',
    hidden: true,
  },
  {
    labelKey: 'contact_resume_zh_label',
    href: '/resume-zh.pdf',
    display: 'resume-zh.pdf',
    hidden: true,
  },
]

export default function Contact() {
  const t = useTranslation()

  return (
    <section id="contact" className="bg-surface py-20 sm:py-28">
      <Sheet>
        <SectionHeader sheet="03" title={t('contact_heading')} />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="font-display font-wide text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {t('contact_subheading')}
            </p>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7">
            <ul className="border-t border-rule">
              {CONTACT_LINKS.filter(link => !link.hidden).map(link => {
                const external = link.href.startsWith('http')
                return (
                  <li
                    key={link.labelKey}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule py-4"
                  >
                    <span className="label w-28 shrink-0">{t(link.labelKey)}</span>
                    <span
                      aria-hidden="true"
                      className="hidden h-px flex-1 border-b border-dotted border-rule-strong sm:block"
                    />
                    <a
                      href={link.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      className="link-ink font-mono text-[13px]"
                    >
                      {link.display}
                    </a>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>
      </Sheet>
    </section>
  )
}
