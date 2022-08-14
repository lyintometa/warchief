import { languages } from '../dataAccess/dataAccess.js'
import dataAccessDiscordService from '../dataAccessDiscord/dataAccessDiscordService.js'

class LanguageService {
  #languageSelectOptions

  constructor() {
    this.#initLanguageSelectOptions()
  }

  getLanguageSelectOptions = guildId => {
    const current = dataAccessDiscordService
      .getDataAccessSettings(guildId).language
    const currentSelectOption = this.#languageSelectOptions.find(_ => _.locale === current)
    console.log(currentSelectOption)
    const n = {...currentSelectOption, emoji: String.fromCodePoint("0x2705")}
    console.log(n)
    return [n,
    ...this.#languageSelectOptions
      .filter(_ => _.locale !== current)]
  }

  update = (guildId, languageId) => {
    const language = languages[languageId]
    dataAccessDiscordService
      .getDataAccessSettings(guildId)
      .updateLanguage(language)
    return language
  }

  #initLanguageSelectOptions = () => {
    this.#languageSelectOptions =
      Object.values(languages).map(_ => ({
        label: _.description,
        value: _.id.toString(),
        emoji: _.emoji,
        locale: _.locale
      })).sort((a, b) => a.label.localeCompare(b.label))
  }
}

export default new LanguageService()
