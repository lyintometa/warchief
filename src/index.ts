import { ApplicationCommandType, ChannelType, Client, Events, MessageFlags, SlashCommandBuilder } from 'discord.js'
import * as dotenv from 'dotenv'

import { clientCommands } from './commands/util/commandLoader.js'
import dataAccessService from './dataAccessDiscord/dataAccessDiscordService.js'
import type { ClientExtended } from './models/ClientExtended.js'
import raidTableService from './service/raidTableService.js'
import ObjectUtils from './utils/ObjectUtils.js'

dotenv.config()

const client = new Client({ intents: ['Guilds', 'GuildMessages'] }) as ClientExtended

client.commands = await clientCommands()

client.once(Events.ClientReady, async client => {
  await dataAccessService.init(client)
})

client.on(Events.GuildAvailable, async guild => {
  if (guild.id != '319046420143538177') {
    return
  }

  const guildCommands = await guild.commands.fetch({ force: true, withLocalizations: true })

  for (const { data: commandDefinition } of client.commands.values()) {
    if (!(commandDefinition instanceof SlashCommandBuilder) || commandDefinition.name !== 'synchronize_commands') {
      continue
    }

    let guildCommand = guildCommands.find(command => command.name === commandDefinition.name)
    if (guildCommand !== undefined) {
      if (
        !ObjectUtils.deepEquals(guildCommand.nameLocalizations, commandDefinition.name_localizations)
        || guildCommand.description !== commandDefinition.description
        || !ObjectUtils.deepEquals(guildCommand.descriptionLocalizations, commandDefinition.description_localizations)
        || guildCommand.type !== ApplicationCommandType.ChatInput
      ) {
        guildCommand = await guild.commands.edit(guildCommand, commandDefinition.toJSON())
      }
    } else {
      guildCommand = await guild.commands.create(commandDefinition.toJSON())
    }
  }
})

client.on(Events.GuildCreate, async guild => {
  await dataAccessService.creatGuildData(guild)
})

client.on(Events.GuildDelete, async guild => {
  dataAccessService.deleteGuildData(guild.id)
})

client.on(Events.MessageDelete, message => {
  if (!message.inGuild()) return
  raidTableService.deleteTable(message)
})

client.on(Events.ChannelDelete, channel => {
  if (channel.type !== ChannelType.GuildText) return
  raidTableService.deleteTableChannel(channel)
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.inGuild()) return

  if (interaction.isChatInputCommand()) {
    try {
      const { commandName, locale } = interaction
      const command = client.commands.get(commandName)
      if (command === undefined) throw new Error(`Unknown command: ${commandName} (${locale})`)
      await command.execute?.(interaction)
    } catch (error) {
      console.error(error)
      if (interaction.replied) {
        await interaction.editReply({
          content: 'There was an error while executing this interaction!',
        })
      } else {
        await interaction.reply({
          content: 'There was an error while executing this interaction!',
          flags: MessageFlags.Ephemeral,
        })
      }
    }
  }
})

client.login(process.env.DJS_TOKEN)
