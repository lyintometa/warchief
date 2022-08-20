import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const commandDataFile = 'command.json'
const emojiDataFile = 'emoji.json'
const languageDataFile = 'language.json'
const playerClassDataFile = 'player_class.json'
const roleDataFile = 'role.json'
const specializationDataFile = 'specialization.json'
const translationDataFile = 'translation.json'

const dataDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
  'data'
)

const readJsonFromFile = fileName =>
  JSON.parse(fs.readFileSync(path.resolve(dataDirectory, fileName)))

const commands = readJsonFromFile(commandDataFile)
const emojis = readJsonFromFile(emojiDataFile)
const languages = readJsonFromFile(languageDataFile)
const playerClasses = readJsonFromFile(playerClassDataFile)
const roles = readJsonFromFile(roleDataFile)
const specializations = readJsonFromFile(specializationDataFile)
const translations = readJsonFromFile(translationDataFile)

Object.keys(languages).forEach(languageId => {
  const language = languages[languageId]
  language.id = parseInt(languageId)
  language.emoji = language.emoji.map(_ => String.fromCodePoint(_)).join('')
})

Object.keys(emojis).forEach(emojiId => {
  emojis[emojiId].id = parseInt(emojiId)
  emojis[emojiId].toString = () =>
    emojis[emojiId].discordId
      ? `<:${emojis[emojiId].name}:${emojis[emojiId].discordId}>`
      : `:${emojis[emojiId].name}:`
})

Object.keys(roles).forEach(roleId => {
  const role = roles[roleId]
  role.id = parseInt(roleId)
  role.emoji = emojis[role.emoji]
})

Object.keys(specializations).forEach(specId => {
  const specialization = specializations[specId]
  specialization.id = parseInt(specId)
  specialization.playerClass = playerClasses[specialization.playerClass]
  specialization.role = roles[specialization.role]
  specialization.emoji = emojis[specialization.emoji]
})

Object.keys(playerClasses).forEach(playerClassId => {
  const playerClass = playerClasses[playerClassId]
  playerClass.id = parseInt(playerClassId)
  playerClass.emoji = emojis[playerClass.emoji]
  playerClass.specializations = Object.keys(specializations)
    .filter(specId => specializations[specId].playerClass.id == playerClassId)
    .map(specId => ({ ...specializations[specId], id: specId }))
})

export {
  commands,
  emojis,
  languages,
  playerClasses,
  specializations,
  roles,
  translations
}
