import { ChannelType, Client, Events, MessageFlags } from 'discord.js'
import * as dotenv from 'dotenv'

import { clientCommands } from './commands/util/commandLoader.js'
import { registerCommands } from './commands/util/dynamicRegistrator.js'
import { commands, languages } from './dataAccess/dataAccess.js'
import dataAccessService from './dataAccessDiscord/dataAccessDiscordService.js'
import type { ClientExtended } from './models/ClientExtended.js'
import languageService from './service/languageService.js'
import raidTableService from './service/raidTableService.js'

dotenv.config()

const client = new Client({ intents: ['Guilds', 'GuildMessages'] }) as ClientExtended

client.commands = await clientCommands()

client.once(Events.ClientReady, async client => {
  await dataAccessService.init(client)
})

client.on(Events.GuildCreate, async guild => {
  await dataAccessService.creatGuildData(guild)
  registerCommands(guild.id, languages[0])
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

  const commandNameInvariantCulture = (name: string, locale: string) =>
    Object.keys(commands[locale]).find(key => commands[locale][key].name === name)

  const lang = languageService.getGuildLanguage(interaction.guildId).locale

  if (interaction.isChatInputCommand()) {
    try {
      const commandName = commandNameInvariantCulture(interaction.commandName, lang)
      if (commandName === undefined) throw new Error(`Unknown command name: ${interaction.commandName} (${lang})`)
      const command = client.commands.get(commandName)
      if (command === undefined) throw new Error(`Unknown command: ${commandName} (${lang})`)
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
