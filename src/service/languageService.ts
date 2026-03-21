import { Snowflake } from 'discord.js'

import { registerCommands } from '../commands/util/dynamicRegistrator.js'
import { languages } from '../dataAccess/dataAccess.js'
import { getGuildSettings } from '../dataAccessDiscord/dataAccessDiscordService.js'
import Language from '../models/Language.js'
import raidTableService from './raidTableService.js'

class LanguageService {
  getGuildLanguage = (guildId: Snowflake): Language => {
    const guildLocale = getGuildSettings(guildId).language
    return Object.values(languages).find(language => language.locale === guildLocale)!
  }

  setGuildLanguage = (guildId: Snowflake, languageId: number) => {
    const language = languages[languageId]
    getGuildSettings(guildId).updateLanguage(language)
    registerCommands(guildId, language)
    raidTableService.updateTables(guildId)
    return language
  }
}

export default new LanguageService()
