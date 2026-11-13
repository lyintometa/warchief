import { Locale } from 'discord.js'

export default interface Language {
  id: number
  locale: Locale
  description: string
  emoji: string
}

export interface LanguageData {
  locale: Locale
  description: string
  emoji: string[]
}
