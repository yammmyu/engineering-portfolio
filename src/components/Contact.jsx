import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

// `hidden` takes a row out of the rendered list without deleting it. Parking
// beat cutting the rows outright, which was the first instinct: that stranded
// contact_resume_*_label in translations.json and lost the hrefs, and bringing
// the English one back was then deleting one flag.
//
// The Chinese résumé is still parked — the file in public/ is the old one and
// there is no new translation of the current CV yet. Un-park it when there is;
// a row whose PDF contradicts the page is worse than a row that isn't there.
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
                // A PDF opens in a new tab too, though it is same-origin. The
                // browser renders it in place otherwise, and the reader who
                // wanted a glance at the CV has lost the page they were
                // reading and has to come back through history. `rel` stays
                // for cross-origin only, where it has something to protect.
                const newTab = external || link.href.endsWith('.pdf')
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
                      target={newTab ? '_blank' : undefined}
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
