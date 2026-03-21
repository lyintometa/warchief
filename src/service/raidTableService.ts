import { EmbedBuilder } from '@discordjs/builders'
import type { Message, TextChannel } from 'discord.js'

import { specializations, roles, commands, emojis } from '../dataAccess/dataAccess.js'
import { getGuildSettings, getGuildPlayerData } from '../dataAccessDiscord/dataAccessDiscordService.js'
import PlayerEntity from '../dataAccessDiscord/entities/PlayerEntity.js'
import { text } from '../i18n/text.js'

type PlayerData = Record<string, PlayerEntity>

interface GuildSettings {
  tables: Record<string, string>
  language: string
  messagesTable: Message[]
  addTableMessage(message: Message): Promise<void>
  deleteTable(message: Message): Promise<void>
  deleteTableChannel(channel: TextChannel): Promise<void>
}

class RaidTableService {
  createTable = (guildId: string, channelId: string): any => {
    const guildSettings: GuildSettings = getGuildSettings(guildId)
    if (guildSettings.tables[channelId]) return
    const playerData = getGuildPlayerData(guildId).playerData
    return this.#constructTableEmbed(guildSettings.language, playerData).data
  }

  updateTables = async (guildId: string): Promise<void> => {
    const guildSettings: GuildSettings = getGuildSettings(guildId)
    const messages: Message[] = guildSettings.messagesTable
    const locale: string = guildSettings.language
    const playerData: PlayerData = getGuildPlayerData(guildId).playerData
    const tableEmbed: EmbedBuilder = this.#constructTableEmbed(locale, playerData)
    await Promise.all(messages.map(_ => _.edit({ embeds: [tableEmbed] })))
  }

  addTableMessage = async (guildId: string, message: Message): Promise<void> =>
    getGuildSettings(guildId).addTableMessage(message)

  deleteTable = async (message: Message<true>): Promise<void> => getGuildSettings(message.guildId).deleteTable(message)
  deleteTableChannel = async (channel: TextChannel): Promise<void> =>
    getGuildSettings(channel.guildId).deleteTableChannel(channel)

  #constructTableEmbed = (locale: string, playerData: Record<string, PlayerEntity>): EmbedBuilder =>
    new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(text(locale, 'raidGroup'))
      .setDescription(this.#constructTable(playerData) + '\u200b' + '\u200b')
      .addFields({
        name: text(locale, 'commands'),
        value: this.#constructCommands(locale),
      })

  #constructTable = (playerData: PlayerData): string =>
    [
      ...Object.keys(playerData)
        .sort(this.#byRole(playerData))
        .map((playerId: string) => {
          const specId = playerData[playerId].specialization
          const playerSpec = specId !== undefined ? specializations[specId] : undefined
          const playerClass = playerSpec?.playerClass
          const roleId = playerData[playerId].role
          const playerRole = playerSpec?.role || (roleId !== undefined ? roles[roleId] : undefined)!
          return `${playerRole.emoji} ${playerClass?.emoji || emojis[0]}${
            playerSpec?.emoji || emojis[0]
          } ${playerData[playerId].name}`
        }),
      '',
      `${roles[0].emoji} ${this.#countRole(playerData, 0)}  ${
        roles[1].emoji
      } ${this.#countRole(playerData, 1)}  ${roles[2].emoji} ${
        this.#countRole(playerData, 2) + this.#countRole(playerData, 3)
      }`,
      '',
    ].join('\n')

  #constructCommands = (locale: string): string =>
    ['class_select', 'class_remove']
      .map(
        (commandKey: string) =>
          '`' + commands[locale][commandKey].name + '`: ' + commands[locale][commandKey].description,
      )
      .join('\n')

  #countRole = (playerData: PlayerData, roleId: number): number =>
    Object.keys(playerData).filter(
      (playerId: string) =>
        playerData[playerId].role === roleId
        || specializations[playerData[playerId].specialization!]?.role.id === roleId,
    ).length

  #byRole =
    (playerData: PlayerData) =>
    (a: string, b: string): number => {
      const playerSpecA = specializations[playerData[a].specialization!]
      const playerSpecB = specializations[playerData[b].specialization!]
      const classA = playerSpecA?.playerClass
      const classB = playerSpecB?.playerClass
      const roleA = playerSpecA?.role || roles[playerData[a].role!]
      const roleB = playerSpecB?.role || roles[playerData[b].role!]
      if (roleA.displayIndex !== roleB.displayIndex) return roleA.displayIndex - roleB.displayIndex
      if (!classA && classB) return 1
      if (classA && !classB) return -1
      if (classA.id !== classB.id) return classA.id - classB.id
      var playerNamesSorted: string[] = [playerData[a].name, playerData[b].name].sort()
      return playerNamesSorted.indexOf(playerData[a].name) - playerNamesSorted.indexOf(playerData[b].name)
    }
}

export default new RaidTableService()
