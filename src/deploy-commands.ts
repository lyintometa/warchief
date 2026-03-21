import { REST, Routes } from 'discord.js'
import * as dotenv from 'dotenv'

import { deployCommands } from './commands/util/commandLoader.js'

dotenv.config()

const global = false
const commands = await deployCommands()
const rest = new REST({ version: '9' }).setToken(process.env.DJS_TOKEN!)

if (global) {
  rest
    .put(Routes.applicationCommands(process.env.DJS_CLIENT_ID!), { body: [] })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error)
} else {
  const guildIds = ['969890487035109386', '996133495590096948']
  await Promise.all(
    guildIds.map(guildId =>
      rest.put(Routes.applicationGuildCommands(process.env.DJS_CLIENT_ID!, guildId), { body: commands }),
    ),
  )
  console.log('Successfully registered guild commands.')
}
