import { translations } from '../dataAccess/dataAccess.js'
import { getGuildSettings } from '../dataAccessDiscord/dataAccessDiscordService.js'

export const text = (guildId, textKey) =>
  translations[getGuildSettings(guildId).language][textKey] || 'undefined'

export const textLang = (locale, textKey) =>
  translations[locale][textKey] || 'undefined'
