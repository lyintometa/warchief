import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Collection } from 'discord.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __commandDirname = path.resolve(__dirname, '..')

const loadCommands = async () =>
  await Promise.all(
    fs
      .readdirSync(__commandDirname)
      .filter(file => file.endsWith('.js'))
      .map(file => import(`../${file}`).then(_ => _.default))
  )

export const clientCommands = async () =>
  new Collection(
    (await loadCommands()).map(command => [command.data.name, command])
  )

export const deployCommands = async () =>
  (await loadCommands()).map(command => command.data.toJSON())
