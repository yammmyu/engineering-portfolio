export class Project {
  constructor({
    id,
    tags = [],
    date = null,
    github = null,
    demo = null,
    image = null,
    figures = [],
    video = null,
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
    // Path under /public, e.g. '/projects/proj_humanoid.jpg'. A row without one
    // falls back to the text-only layout, and so does a row whose file is
    // missing — see the onError in ProjectFigure.
    this.image = image
    // Extra views, shown only in the row's expanded detail panel —
    // `[{ src, key }]`, where `key` is the translation key for the caption.
    // A row with none is not expandable and renders exactly as it always did.
    //
    // These are the frames that could not survive the row figure: it caps at
    // 17rem, and the panel gives them the full sheet width at three across.
    this.figures = figures
    // `{ src, poster, key, position }`, shown as the first cell of the detail
    // panel's figure row. It is for the part of a project a still cannot carry:
    // the speaker's sound, the panels lit in a dark room.
    //
    // `position` is the `object-position` for the 16:10 crop, because these are
    // 9:16 phone clips and where the subject sits in the frame differs per clip
    // — it is measured from the footage, not guessed. Never autoplayed, and
    // never muted to get around that: nothing here performs without being asked.
    this.video = video
  }

  get titleKey() {
    return `${this.id}_title`
  }

  get descKey() {
    return `${this.id}_desc`
  }

  get hasLinks() {
    return this.github !== null || this.demo !== null
  }

  /** A row opens a detail panel only if it has extra views to put in one. */
  get hasDetail() {
    return this.figures.length > 0 || this.video !== null
  }

  /** Longer account shown in the detail panel, above its figures. */
  get detailKey() {
    return `${this.id}_detail`
  }
}
