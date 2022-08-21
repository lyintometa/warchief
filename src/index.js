import * as dotenv from 'dotenv'
import { Client } from 'discord.js'
import dataAccessService from './dataAccessDiscord/dataAccessDiscordService.js'
import { commands, languages } from './dataAccess/dataAccess.js'
import languageService from './service/languageService.js'
import { clientCommands } from './commands/util/commandLoader.js'
import raidTableService from './service/raidTableService.js'
import { registerCommands } from './commands/util/dynamicRegistrator.js'
dotenv.config()

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES']
})

client.commands = await clientCommands()

client.once('ready', async () => {
  await dataAccessService.init(client)
})

client.on('guildCreate', async guild => {
  await dataAccessService.creatGuildData(guild)
  registerCommands(guild.id, languages[0])
})

client.on('guildDelete', async guild => {
  dataAccessService.deleteGuildData(guild)
})

client.on('messageDelete', message => {
  raidTableService.deleteTable(message)
})

client.on('channelDelete', channel => {
  raidTableService.deleteTableChannel(channel)
})

client.on('interactionCreate', async interaction => {
  const commandNameInvariantCulture = (name, locale) =>
    Object.keys(commands[locale]).find(
      key => commands[locale][key].name === name
    )

  const name =
    interaction.commandName ?? interaction.message?.interaction.commandName
  const lang = languageService.getLanguageLocale(interaction.guildId)
  let command = client.commands.get(commandNameInvariantCulture(name, lang))
  if (!command) return

  try {
    if (interaction.isCommand()) await command.execute(interaction)
    if (interaction.isSelectMenu()) await command.executeSelect(interaction)
    if (interaction.isButton()) await command.executeButton(interaction)
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: 'There was an error while executing this interaction!',
      ephemeral: true
    })
  }
})

client.login(process.env.DJS_TOKEN)
