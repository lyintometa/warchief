export default interface Language {
  id: number
  locale: string
  description: string
  emoji: string
}

export interface LanguageData {
  locale: string
  description: string
  emoji: string[]
}
