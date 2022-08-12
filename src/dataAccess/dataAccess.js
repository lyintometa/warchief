import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const allowedLanguages = ['enGB', 'deDE']
const language = allowedLanguages.includes(process.env.LANGUAGE)
  ? process.env.LANGUAGE
  : 'enGB'
const emojiDataFile = 'emoji.json'
const playerClassDataFile = 'player_class.json'
const roleDataFile = 'role.json'
const specializationDataFile = 'specialization.json'

const dataDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
  'data'
)

const readJsonFromFile = fileName =>
  JSON.parse(fs.readFileSync(path.resolve(dataDirectory, fileName)))

const emojis = readJsonFromFile(emojiDataFile)
const playerClasses = readJsonFromFile(playerClassDataFile)
const roles = readJsonFromFile(roleDataFile)
const specializations = readJsonFromFile(specializationDataFile)

Object.keys(emojis).forEach(emojiId => {
  emojis[emojiId].id = emojiId
  emojis[emojiId].toString = () =>
    `<:${emojis[emojiId].name}:${emojis[emojiId].discordId}>`
})

Object.keys(roles).forEach(roleId => {
  const role = roles[roleId]
  role.id = roleId
  role.emoji = emojis[role.emoji]
  role.description = role.description[language]
})

Object.keys(specializations).forEach(specId => {
  const specialization = specializations[specId]
  specialization.id = specId
  specialization.playerClass = playerClasses[specialization.playerClass]
  specialization.role = roles[specialization.role]
  specialization.emoji = emojis[specialization.emoji]
  specialization.description = specialization.description[language]
})

Object.keys(playerClasses).forEach(playerClassId => {
  const playerClass = playerClasses[playerClassId]
  playerClass.id = playerClassId
  playerClass.emoji = emojis[playerClass.emoji]
  playerClass.specializations = Object.keys(specializations)
    .filter(specId => specializations[specId].playerClass.id == playerClassId)
    .map(specId => ({ ...specializations[specId], id: specId }))
  playerClass.description = playerClass.description[language]
})

export default { emojis, playerClasses, specializations, roles }
