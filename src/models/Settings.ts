import { Locale } from 'discord.js'

export default interface Settings {
  locale: Locale
  tables: Record<string, string>
}
