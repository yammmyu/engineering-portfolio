import React from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import { SectionHeader, Reveal, Sheet } from './Section.jsx'

/**
 * Revision history: where the work was done, and when.
 *
 * A drawing set records who issued each revision and on what date, which is
 * exactly the shape of employment — so experience is a table of dated rows, not
 * a second projects list with prose in it.
 *
 * This exists because the strongest credential on the site was invisible: the
 * internship behind P-01 appeared only as an unlinked project row, with no
 * employer, no dates, and no role. A reader could finish the page without
 * learning where he has worked. Projects answer "can he build"; this answers
 * "has anyone paid him to", and recruiters screen on the second one first.
 *
 * `org` and `dates` render verbatim — a company name is not translated, and
 * numerals read the same in both languages. Everything written in prose goes
 * through `t()` like the rest of the site.
 *
 * ROLES IS EMPTY BY DESIGN. Employers, titles, and dates are facts about the
 * author and must come from him — see PRODUCT.md, "Content is true". The
 * section renders nothing at all while the array is empty, so an unpopulated
 * table can never ship. Wiring, when the rows land:
 *
 *   1. fill ROLES, and add the `exp_*_role` / `exp_*_desc` keys it references
 *   2. add <Experience /> to App.jsx above <Projects />
 *   3. add its entry to NAV_LINKS in Navbar.jsx
 *   4. renumber the sheets — experience 01, projects 02, about 03, contact 04
 */
const ROLES = []

function RoleRow({ role, index }) {
  const t = useTranslation()
  const ref = `E-${String(index + 1).padStart(2, '0')}`

  return (
    <li className="border-b border-rule">
      <div className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 px-2 py-6 sm:px-4 sm:py-7">
        <div className="col-span-12 flex items-baseline gap-3 sm:col-span-2 sm:block">
          <span className="label">{ref}</span>
          <span className="label sm:mt-1.5 sm:block">{role.dates}</span>
        </div>

        <div className="col-span-12 max-w-measure sm:col-span-10 lg:col-span-7">
          {/* The organisation leads. It is the first thing a reader is scanning
              for, and on a row this size it is also the only thing they may
              read — so it takes the display face and the role sits under it. */}
          <h3 className="font-display font-wide text-lg font-semibold leading-snug text-ink sm:text-xl">
            {role.org}
          </h3>
          <p className="label mt-1.5">
            {t(role.roleKey)}
            {role.location && ` · ${role.location}`}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{t(role.descKey)}</p>
        </div>

        {/* The project this role produced, cited by its row reference so the two
            sheets are visibly the same work seen twice rather than two claims
            that happen to rhyme. */}
        {role.projectRef && (
          <div className="col-span-12 sm:col-span-10 sm:col-start-3 lg:col-span-3 lg:col-start-10 lg:text-right">
            <span className="label">{role.projectRef}</span>
          </div>
        )}
      </div>
    </li>
  )
}

export default function Experience() {
  const t = useTranslation()

  // Nothing to show is not an empty sheet — it is no sheet. A heading with a
  // rule under it and no rows reads as a page that failed to load.
  if (!ROLES.length) return null

  const count = String(ROLES.length).padStart(2, '0')

  return (
    <section id="experience" className="py-20 sm:py-28">
      <Sheet>
        <SectionHeader
          sheet="01"
          title={t('experience_heading')}
          meta={`${count} ${t('experience_items_label')}`}
        />

        <Reveal>
          <ol className="border-t border-rule-strong">
            {ROLES.map((role, i) => (
              <RoleRow key={role.org + role.dates} role={role} index={i} />
            ))}
          </ol>
        </Reveal>
      </Sheet>
    </section>
  )
}
