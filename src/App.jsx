import React from 'react'
import { LanguageProvider, useTranslation } from './context/LanguageContext.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Projects from './components/Projects.jsx'
import Contact from './components/Contact.jsx'

function FooterText() {
  const t = useTranslation()
  return <p>{t('footer_built')}</p>
}

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Projects />
          <Contact />
        </main>
        <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
          <FooterText />
        </footer>
      </div>
    </LanguageProvider>
  )
}
