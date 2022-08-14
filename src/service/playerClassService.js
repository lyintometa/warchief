import data, { languages, playerClasses, specializations } from '../dataAccess/dataAccess.js'
import dataAccessDiscordService from '../dataAccessDiscord/dataAccessDiscordService.js'

class PlayerClassService {
  #playerClasses = data.playerClasses
  #specializations = data.specializations
  #dataAccessDiscordService = dataAccessDiscordService
  #classSelectOptions = {}
  #specSelectOptions = {}

  constructor() {
    this.#initClassSelectOptions()
    this.#initSpecSelectOptions()
  }

  getClassSelectOptions = guildId =>
    this.#classSelectOptions[dataAccessDiscordService.getDataAccessSettings(guildId).language]


  getSpecSelectOptions = (guildId, classId) =>
    this.#specSelectOptions[dataAccessDiscordService.getDataAccessSettings(guildId).language][classId]

  createOrUpdate = (guildId, user, playerClassId, specializationId) => {
    const playerClass = this.#playerClasses[playerClassId]
    const specialization = this.#specializations[specializationId]
    var dataAccessPlayer =
      this.#dataAccessDiscordService.getDataAccessPlayer(guildId)
    dataAccessPlayer.createOrUpdate(user, playerClass, specialization)
    this.#dataAccessDiscordService
      .getDataAccessSettings(guildId)
      .updatePlayerData(dataAccessPlayer.getPlayerData())
    const locale = dataAccessDiscordService.getDataAccessSettings(guildId).language
    return { 
      playerClassDesc: playerClass.description[locale], 
      playerClassEmoji: playerClass.emoji,
      specDesc: specialization.description[locale],
      specEmoji: specialization.emoji
    }
  }

  delete = (guildId, user) => {
    var dataAccessPlayer =
      this.#dataAccessDiscordService.getDataAccessPlayer(guildId)
    dataAccessPlayer.delete(user)
    this.#dataAccessDiscordService
      .getDataAccessSettings(guildId)
      .updatePlayerData(dataAccessPlayer.getPlayerData())
  }

  #initClassSelectOptions = () =>
    Object.keys(languages).forEach(languageId => {
      const locale = languages[languageId].locale
      this.#classSelectOptions[locale] = Object.values(playerClasses).map(_ => ({
        value: _.id.toString(),
        emoji: _.emoji?.discordId,
        label: _.description[locale] ?? 'undefined'
      }))
    })

  #initSpecSelectOptions = () =>
    Object.keys(languages).forEach(languageId => {
      const locale = languages[languageId].locale
      this.#specSelectOptions[locale] = {}
      Object.values(playerClasses).forEach(playerClass => {
        this.#specSelectOptions[locale][playerClass.id] =
          playerClass.specializations.map(spec => ({
            value: spec.id.toString(),
            emoji: spec.emoji?.discordId,
            label: spec.description[locale] ?? 'undefined'
          }))
      })
    })
}

export default new PlayerClassService()
