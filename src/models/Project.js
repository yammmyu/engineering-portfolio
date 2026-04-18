export class Project {
  constructor({ id, tags = [], github = null, demo = null }) {
    this.id = id
    this.tags = tags
    this.github = github
    this.demo = demo
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
}
