import React, { createContext, useContext, useState, useEffect } from 'react'
import translations from '../translations.json'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('portfolio-lang') || 'en'
  })

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'zh' : 'en'
      localStorage.setItem('portfolio-lang', next)
      return next
    })
  }

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useTranslation() {
  const { lang } = useLanguage()
  return (key) => {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang] ?? entry['en'] ?? key
  }
}
