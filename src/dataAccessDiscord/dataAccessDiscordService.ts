import type { Client, Guild, Snowflake } from 'discord.js'

import PlayerAccess from './playerAccess.js'
import SettingsAccess from './settingsAccess.js'

class DataAccessService {
  #playerAccesses: Record<string, PlayerAccess> = {}
  #settingsAccesses: Record<string, SettingsAccess> = {}

  init = async (client: Client): Promise<void> => {
    await Promise.all(client.guilds.cache.map(guild => this.creatGuildData(guild)))
  }

  creatGuildData = async (guild: Guild): Promise<void> => {
    const playerAccess = new PlayerAccess()
    await playerAccess.init(guild)
    this.#playerAccesses[guild.id] = playerAccess

    const settingsAccess = new SettingsAccess()
    await settingsAccess.init(guild)
    this.#settingsAccesses[guild.id] = settingsAccess
  }

  getPlayerData = (guildId: Snowflake): PlayerAccess => {
    var dataAccess = this.#playerAccesses[guildId]
    if (!dataAccess) throw new Error('Tried to get a PlayerAccess that does not exist.')
    return dataAccess
  }

  getSettings = (guildId: Snowflake): SettingsAccess => {
    var dataAccess = this.#settingsAccesses[guildId]
    if (!dataAccess) throw new Error('Tried to get a SettingsAccess that does not exist.')
    return dataAccess
  }

  deleteGuildData = (guildId: Snowflake): void => {
    delete this.#playerAccesses[guildId]
  }
}

const service = new DataAccessService()

export const getGuildSettings = (guildId: Snowflake): SettingsAccess => service.getSettings(guildId)
export const getGuildPlayerData = (guildId: Snowflake): PlayerAccess => service.getPlayerData(guildId)
export default service
