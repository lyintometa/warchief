import {
  Collection,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import ClientCommand from '../../models/ClientCommand.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __commandDirname = path.resolve(__dirname, '..')

const loadCommands = async (): Promise<ClientCommand[]> =>
  await Promise.all(
    fs
      .readdirSync(__commandDirname)
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
      .map(file => import(`../${file}`).then(_ => _.default)),
  )

export const clientCommands = async (): Promise<Collection<string, ClientCommand>> =>
  new Collection((await loadCommands()).map(command => [command.data.name, command]))

export const deployCommands = async (): Promise<
  (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]
> => {
  const commands = await loadCommands()
  return commands.map(command => command.data.toJSON())
}
