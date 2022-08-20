import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { commands } from '../../dataAccess/dataAccess.js'

export const registerCommands = async (guildId, lang) =>
  new REST({ version: '9' })
    .setToken(process.env.DJS_TOKEN)
    .put(Routes.applicationGuildCommands(process.env.DJS_CLIENT_ID, guildId), {
      body: Object.values(commands[lang.locale])
    })
    .then(() =>
      console.log(
        `Successfully registered guild (${guildId}) commands: ${lang.description}`
      )
    )
