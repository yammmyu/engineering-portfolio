import React from 'react'
import { LanguageProvider, useTranslation } from './context/LanguageContext.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Projects from './components/Projects.jsx'
import Contact from './components/Contact.jsx'
import { Sheet } from './components/Section.jsx'

const CORNERS = [
  'left-0 top-0',
  'right-0 top-0',
  'left-0 bottom-0',
  'right-0 bottom-0',
]

/** Registration marks at the corners of the sheet. */
function SheetMarks() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-5 z-40 hidden lg:block">
      {CORNERS.map(corner => (
        <span key={corner} className={`absolute ${corner}`}>
          <span
            className={`absolute h-3 w-px bg-rule-strong ${
              corner.includes('bottom') ? 'bottom-0' : 'top-0'
            } ${corner.includes('right') ? 'right-0' : 'left-0'}`}
          />
          <span
            className={`absolute h-px w-3 bg-rule-strong ${
              corner.includes('bottom') ? 'bottom-0' : 'top-0'
            } ${corner.includes('right') ? 'right-0' : 'left-0'}`}
          />
        </span>
      ))}
    </div>
  )
}

function Footer() {
  const t = useTranslation()

  return (
    <footer className="border-t border-rule py-8">
      <Sheet className="flex flex-wrap items-center justify-between gap-3">
        <span className="label">{t('footer_built')}</span>
        <span className="label">
          © {new Date().getFullYear()} {t('hero_name')}
        </span>
      </Sheet>
    </footer>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen font-sans text-ink">
        <SheetMarks />
        <Navbar />
        <main>
          <Hero />
          <About />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  )
}
