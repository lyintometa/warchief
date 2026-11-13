import { Guild, Locale, Snowflake } from 'discord.js'

//import { registerCommands } from '../commands/util/dynamicRegistrator.js'
import { languages } from '../dataAccess/dataAccess.js'
import { getGuildSettings } from '../dataAccessDiscord/dataAccessDiscordService.js'
import raidTableService from './raidTableService.js'

class LanguageService {
  getGuildLocale = (guildId: Snowflake): Locale => {
    const guildLocale = getGuildSettings(guildId).language
    return Object.values(languages).find(language => language.locale === guildLocale)?.locale ?? languages[0].locale
  }

  setGuildLanguage = (guild: Guild, locale: Locale) => {
    getGuildSettings(guild.id).updateLanguage(locale)
    raidTableService.updateTables(guild)
  }
}

export default new LanguageService()
