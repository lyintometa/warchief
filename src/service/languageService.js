import { languages, translations } from '../dataAccess/dataAccess.js'
import { getGuildSettings } from '../dataAccessDiscord/dataAccessDiscordService.js'
import { registerCommands } from '../commands/util/dynamicRegistrator.js'
import raidTableService from './raidTableService.js'

class LanguageService {
  #languageSelectOptions

  constructor() {
    this.#initLanguageSelectOptions()
  }

  getLanguageSelectOptions = guildId => {
    const locale = getGuildSettings(guildId).language
    const currentSelectOption = this.#languageSelectOptions.find(
      _ => _.locale === locale
    )
    const n = { ...currentSelectOption, emoji: String.fromCodePoint('0x2705') }
    return [n, ...this.#languageSelectOptions.filter(_ => _.locale !== locale)]
  }

  getLanguageLocale = guildId => getGuildSettings(guildId).language

  get = (guildId, textKey) =>
    translations[getGuildSettings(guildId).language][textKey]

  update = (guildId, languageId) => {
    const language = languages[languageId]
    getGuildSettings(guildId).updateLanguage(language)
    registerCommands(guildId, language)
    raidTableService.updateTables(guildId)
    return language
  }

  #initLanguageSelectOptions = () => {
    this.#languageSelectOptions = Object.values(languages)
      .map(_ => ({
        label: _.description,
        value: _.id.toString(),
        emoji: _.emoji,
        locale: _.locale
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }
}

export default new LanguageService()
