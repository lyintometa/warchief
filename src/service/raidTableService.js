import {
  specializations,
  roles,
  commands,
  emojis
} from '../dataAccess/dataAccess.js'
import {
  getGuildSettings,
  getGuildPlayerData
} from '../dataAccessDiscord/dataAccessDiscordService.js'
import { EmbedBuilder } from '@discordjs/builders'
import { textLang } from './text.js'

class RaidTableService {
  createTable = (guildId, channelId) => {
    const guildSettings = getGuildSettings(guildId)
    if (guildSettings.tables[channelId]) return
    const playerData = getGuildPlayerData(guildId).playerData
    return this.#constructTableEmbed(guildSettings.language, playerData).data
  }

  updateTables = async guildId => {
    const guildSettings = getGuildSettings(guildId)
    const messages = guildSettings.messagesTable
    const locale = guildSettings.language
    const playerData = getGuildPlayerData(guildId).playerData
    const tableEmbed = this.#constructTableEmbed(locale, playerData).data
    await Promise.all(messages.map(_ => _.edit({ embeds: [tableEmbed] })))
  }

  addTableMessage = async (guildId, message) =>
    getGuildSettings(guildId).addTableMessage(message)

  #constructTableEmbed = (locale, playerData) =>
    new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(textLang(locale, 'raidGroup'))
      .setDescription(this.#constructTable(playerData) + '\u200b' + '\u200b')
      .addFields({
        name: textLang(locale, 'commands'),
        value: this.#constructCommands(locale)
      })

  #constructTable = playerData =>
    [
      ...Object.keys(playerData)
        .sort(this.#byRole(playerData))
        .map(playerId => {
          const playerSpec =
            specializations[playerData[playerId].specialization]
          const playerClass = playerSpec?.playerClass
          const playerRole =
            playerSpec?.role || roles[playerData[playerId].role]
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
      ''
    ].join('\n')

  #constructCommands = locale =>
    ['class_select', 'class_remove']
      .map(
        commandKey =>
          '`' +
          commands[locale][commandKey].name +
          '`: ' +
          commands[locale][commandKey].description
      )
      .join('\n')

  #countRole = (playerData, roleId) =>
    Object.keys(playerData).filter(
      playerId =>
        playerData[playerId].role === roleId ||
        specializations[playerData[playerId].specialization]?.role.id === roleId
    ).length

  #byRole = playerData => (a, b) => {
    const playerSpecA = specializations[playerData[a].specialization]
    const playerSpecB = specializations[playerData[b].specialization]
    const classA = playerSpecA?.playerClass
    const classB = playerSpecB?.playerClass
    const roleA = playerSpecA?.role || roles[playerData[a].role]
    const roleB = playerSpecB?.role || roles[playerData[b].role]
    if (roleA.displayIndex !== roleB.displayIndex)
      return roleA.displayIndex - roleB.displayIndex
    if (!classA && classB) return 1
    if (classA && !classB) return -1
    if (classA.id !== classB.id) return classA.id - classB.id
    var playerNamesSorted = [playerData[a].name, playerData[b].name].sort()
    return (
      playerNamesSorted.indexOf(playerData[a].name) -
      playerNamesSorted.indexOf(playerData[b].name)
    )
  }
}

export default new RaidTableService()
