export class Project {
  constructor({
    id,
    tags = [],
    date = null,
    github = null,
    demo = null,
    reference = null,
    image = null,
  }) {
    this.id = id
    this.tags = tags
    // When it was built, as it would appear in a drawing's date field —
    // `'2025-06 → 08'`, or `'2025-06 → now'` for something still open. Numerals
    // and an arrow read the same in both languages, so this is not a
    // translation key; it renders verbatim in the row's left rail.
    //
    // A row without one renders as it always did. Dates are facts about the
    // author's work: leave this null rather than estimating one.
    this.date = date
    this.github = github
    this.demo = demo
    // Somewhere the work came from rather than somewhere it lives: the
    // published build a project was made from, a datasheet, a paper. It exists
    // because a bench build has neither a repo nor a demo, and putting a
    // tutorial URL in `github` makes the row's marker say GITHUB ↗ about a
    // page that is not one — the row would be lying in the one place a reader
    // checks. Ranks below both: a row that has its own code links to that.
    this.reference = reference
    // Path under /public, e.g. '/projects/proj_humanoid.jpg'. A row without one
    // falls back to the text-only layout, and so does a row whose file is
    // missing — see the onError in ProjectFigure.
    this.image = image
  }

  get titleKey() {
    return `${this.id}_title`
  }

  get descKey() {
    return `${this.id}_desc`
  }

  get hasLinks() {
    return this.github !== null || this.demo !== null || this.reference !== null
  }
}
