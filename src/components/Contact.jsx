import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'

const CONTACT_LINKS = [
  {
    labelKey: 'contact_email_label',
    href: 'mailto:yanyu@example.com',
    display: 'yanyu@example.com',
  },
  {
    labelKey: 'contact_linkedin_label',
    href: 'https://linkedin.com/in/yanyuchen',
    display: 'linkedin.com/in/yanyuchen',
  },
  {
    labelKey: 'contact_github_label',
    href: 'https://github.com/yanyuc',
    display: 'github.com/yanyuc',
  },
  {
    labelKey: 'contact_resume_label',
    href: '/resume.pdf',
    display: 'Download PDF',
  },
]

export default function Contact() {
  const t = useTranslation()

  return (
    <section id="contact" className="bg-gray-50 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('contact_heading')}
        </h2>
        <p className="text-gray-500 mb-12 max-w-xl">
          {t('contact_subheading')}
        </p>

        <div className="space-y-4">
          {CONTACT_LINKS.map(link => (
            <div key={link.labelKey} className="flex items-baseline gap-4">
              <span className="w-20 text-sm text-gray-400 font-medium shrink-0">
                {t(link.labelKey)}
              </span>
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sm text-accent hover:underline"
              >
                {link.display}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
