import data from '../dataAccess/dataAccess.js'
import dataAccessDiscordService from '../dataAccessDiscord/dataAccessDiscordService.js'

class PlayerClassService {
  #playerClasses = data.playerClasses
  #specializations = data.specializations
  #dataAccessDiscordService = dataAccessDiscordService

  getClassSelectOptions = () =>
    Object.values(this.#playerClasses).map(_ => ({
      label: _.description,
      value: _.id,
      emoji: _.emoji?.discordId
    }))

  getSpecSelectOptions = classId =>
    this.#playerClasses[classId].specializations.map(_ => ({
      label: _.description,
      description: _.role.description,
      value: _.id,
      emoji: _.emoji?.discordId
    }))

  createOrUpdate = (guildId, user, playerClassId, specializationId) => {
    const playerClass = this.#playerClasses[playerClassId]
    const specialization = this.#specializations[specializationId]
    var dataAccessPlayer =
      this.#dataAccessDiscordService.getDataAccessPlayer(guildId)
    dataAccessPlayer.createOrUpdate(user, playerClass, specialization)
    this.#dataAccessDiscordService
      .getDataAccessSettings(guildId)
      .updatePlayerData(dataAccessPlayer.getPlayerData())
    return { playerClass, specialization }
  }

  delete = (guildId, user) => {
    var dataAccessPlayer =
      this.#dataAccessDiscordService.getDataAccessPlayer(guildId)
    dataAccessPlayer.delete(user)
    this.#dataAccessDiscordService
      .getDataAccessSettings(guildId)
      .updatePlayerData(dataAccessPlayer.getPlayerData())
  }
}

export default new PlayerClassService()
