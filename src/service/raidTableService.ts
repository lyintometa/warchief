import { APIEmbed, EmbedBuilder, Guild, Locale, Message, SlashCommandBuilder, TextChannel } from 'discord.js'

import { clientCommands } from '../commands/util/commandLoader.js'
import { specializations, roles, emojis } from '../dataAccess/dataAccess.js'
import { getGuildSettings, getGuildPlayerData } from '../dataAccessDiscord/dataAccessDiscordService.js'
import PlayerEntity from '../dataAccessDiscord/entities/PlayerEntity.js'
import { commonTexts, t } from '../utils/translationUtils.js'

const texts = {
  raidGroup: {
    [Locale.EnglishGB]: 'Raid Group',
    [Locale.German]: 'Raidkader',
  },
}

type PlayerData = Record<string, PlayerEntity>

interface GuildSettings {
  tables: Record<string, string>
  language: Locale
  messagesTable: Message[]
  addTableMessage(message: Message): Promise<void>
  deleteTable(message: Message): Promise<void>
  deleteTableChannel(channel: TextChannel): Promise<void>
}

class RaidTableService {
  createTable = async (guild: Guild, channelId: string): Promise<APIEmbed | undefined> => {
    const guildSettings: GuildSettings = getGuildSettings(guild.id)
    if (guildSettings.tables[channelId]) return undefined
    const playerData = getGuildPlayerData(guild.id).playerData
    const embed = await this.#constructTableEmbed(guild, guildSettings.language, playerData)
    return embed.data
  }

  updateTables = async (guild: Guild): Promise<void> => {
    const guildSettings: GuildSettings = getGuildSettings(guild.id)
    const messages: Message[] = guildSettings.messagesTable
    const playerData: PlayerData = getGuildPlayerData(guild.id).playerData
    const tableEmbed: EmbedBuilder = await this.#constructTableEmbed(guild, guildSettings.language, playerData)
    await Promise.all(messages.map(_ => _.edit({ embeds: [tableEmbed] })))
  }

  addTableMessage = async (guildId: string, message: Message): Promise<void> =>
    getGuildSettings(guildId).addTableMessage(message)

  deleteTable = async (message: Message<true>): Promise<void> => getGuildSettings(message.guildId).deleteTable(message)
  deleteTableChannel = async (channel: TextChannel): Promise<void> =>
    getGuildSettings(channel.guildId).deleteTableChannel(channel)

  #constructTableEmbed = async (
    guild: Guild,
    locale: Locale,
    playerData: Record<string, PlayerEntity>,
  ): Promise<EmbedBuilder> =>
    new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(t(texts, locale, 'raidGroup'))
      .setDescription((await this.#constructTable(guild, playerData)) + '\u200b' + '\u200b')
      .addFields({
        name: t(commonTexts, locale, 'command.name.plural'),
        value: await this.#constructCommands(locale),
      })

  #constructTable = async (guild: Guild, playerData: PlayerData): Promise<string> => {
    const guildMembers = await guild.members.fetch({ user: Object.keys(playerData) })

    return [
      ...Object.keys(playerData)
        .sort(this.#byRole(playerData))
        .map((playerId: string) => {
          const specId = playerData[playerId].specialization
          const playerSpec = specId !== undefined ? specializations[specId] : undefined
          const playerClass = playerSpec?.playerClass
          const roleId = playerData[playerId].role
          const playerRole = playerSpec?.role || (roleId !== undefined ? roles[roleId] : undefined)!
          return `${playerRole.emoji} ${playerClass?.emoji || emojis[0]}${playerSpec?.emoji || emojis[0]} ${guildMembers.find(member => member.id === playerId)?.nickname ?? playerData[playerId].name}`
        }),
      '',
      `${roles[0].emoji} ${this.#countRole(playerData, 0)}  ${roles[1].emoji} ${this.#countRole(playerData, 1)}  ${roles[2].emoji} ${this.#countRole(playerData, 2) + this.#countRole(playerData, 3)}`,
      '',
    ].join('\n')
  }

  #constructCommands = async (locale: Locale): Promise<string> => {
    {
      const commands = await clientCommands()

      return ['class_select', 'class_remove']
        .map(commandName => {
          const command = commands.get(commandName)! as { data: SlashCommandBuilder }
          const name = command.data.name_localizations?.[locale] ?? command.data.name
          const description = command.data.description_localizations?.[locale] ?? command.data.description
          return `\`/${name}\`: ${description}`
        })
        .join('\n')
    }
  }

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
