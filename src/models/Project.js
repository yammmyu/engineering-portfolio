export class Project {
  constructor({ id, titleKey, descKey, tags = [], github = null, demo = null }) {
    this.id = id
    this.titleKey = titleKey
    this.descKey = descKey
    this.tags = tags
    this.github = github
    this.demo = demo
  }

  get hasLinks() {
    return this.github !== null || this.demo !== null
  }
}
