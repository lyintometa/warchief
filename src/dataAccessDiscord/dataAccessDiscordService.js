import PlayerAccess from './playerAccess.js'
import SettingsAccess from './settingsAccess.js'

class DataAccessService {
  #playerAccesses = {}
  #settingsAccesses = {}

  init = async client => {
    await Promise.all(
      client.guilds.cache.map(guild => this.creatGuildData(guild))
    )
  }

  creatGuildData = async guild => {
    const playerAccess = new PlayerAccess()
    await playerAccess.init(guild)
    this.#playerAccesses[guild.id] = playerAccess

    const settingsAccess = new SettingsAccess()
    await settingsAccess.init(guild)
    this.#settingsAccesses[guild.id] = settingsAccess
  }

  getPlayerData = guildId => {
    var dataAccess = this.#playerAccesses[guildId]
    if (!dataAccess)
      throw new Error('Tried to get a PlayerAccess that does not exist.')
    return dataAccess
  }

  getSettings = guildId => {
    var dataAccess = this.#settingsAccesses[guildId]
    if (!dataAccess)
      throw new Error('Tried to get a SettingsAccess that does not exist.')
    return dataAccess
  }

  deleteGuildData = guild => {
    delete this.#playerAccesses[guild.id]
  }
}

const service = new DataAccessService()

export const getGuildSettings = guildId => service.getSettings(guildId)
export const getGuildPlayerData = guildId => service.getPlayerData(guildId)
export default service
