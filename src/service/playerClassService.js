import {
  languages,
  playerClasses,
  specializations
} from '../dataAccess/dataAccess.js'
import {
  getGuildSettings,
  getGuildPlayerData
} from '../dataAccessDiscord/dataAccessDiscordService.js'
import raidTableService from './raidTableService.js'

class PlayerClassService {
  #classSelectOptions = {}
  #specSelectOptions = {}

  constructor() {
    this.#initClassSelectOptions()
    this.#initSpecSelectOptions()
  }

  getClassSelectOptions = guildId =>
    this.#classSelectOptions[getGuildSettings(guildId).language]

  getSpecSelectOptions = (guildId, classId) =>
    this.#specSelectOptions[getGuildSettings(guildId).language][classId]

  createOrUpdate = (guildId, user, playerClassId, specializationId) => {
    const playerClass = playerClasses[playerClassId]
    const specialization = specializations[specializationId]
    getGuildPlayerData(guildId).createOrUpdate(
      user,
      playerClass,
      specialization
    )
    const locale = getGuildSettings(guildId).language
    raidTableService.updateTables(guildId)
    return {
      playerClassDesc: playerClass.description[locale],
      playerClassEmoji: playerClass.emoji,
      specDesc: specialization.description[locale],
      specEmoji: specialization.emoji
    }
  }

  delete = (guildId, user) => getGuildPlayerData(guildId).delete(user)

  #initClassSelectOptions = () =>
    Object.keys(languages).forEach(languageId => {
      const locale = languages[languageId].locale
      this.#classSelectOptions[locale] = Object.values(playerClasses).map(
        _ => ({
          value: _.id.toString(),
          emoji: _.emoji?.discordId,
          label: _.description[locale] ?? 'undefined'
        })
      )
    })

  #initSpecSelectOptions = () =>
    Object.keys(languages).forEach(languageId => {
      const locale = languages[languageId].locale
      this.#specSelectOptions[locale] = {}
      Object.values(playerClasses).forEach(playerClass => {
        this.#specSelectOptions[locale][playerClass.id] =
          playerClass.specializations.map(spec => ({
            value: spec.id.toString(),
            description: spec.role.description[locale],
            emoji: spec.emoji?.discordId,
            label: spec.description[locale] ?? 'undefined'
          }))
      })
    })
}

export default new PlayerClassService()
