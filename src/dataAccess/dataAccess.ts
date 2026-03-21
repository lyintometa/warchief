import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Emoji, { EmojiData } from '../models/Emoji.js'
import Language, { LanguageData } from '../models/Language.js'
import PlayerClass, { PlayerClassData } from '../models/PlayerClass.js'
import Role, { RoleData } from '../models/Role.js'
import Specialization, { SpecializationData } from '../models/Specialization.js'
import ArrayUtils from '../utils/ArrayUtils.js'

const commandDataFile = 'command.json'
const emojiDataFile = 'emoji.json'
const languageDataFile = 'language.json'
const playerClassDataFile = 'player_class.json'
const roleDataFile = 'role.json'
const specializationDataFile = 'specialization.json'
const translationDataFile = 'translation.json'

const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', 'src/data')

const readJsonFromFile = <T>(fileName: string) =>
  JSON.parse(fs.readFileSync(path.resolve(dataDirectory, fileName)).toString('utf-8')) as T

const commands =
  readJsonFromFile<Record<string, Record<string, { name: string; description: string }>>>(commandDataFile)
const emojiData = readJsonFromFile<Record<string, EmojiData>>(emojiDataFile)
const languageData = readJsonFromFile<Record<string, LanguageData>>(languageDataFile)
const playerClassData = readJsonFromFile<Record<string, PlayerClassData>>(playerClassDataFile)
const roleData = readJsonFromFile<Record<string, RoleData>>(roleDataFile)
const specializationData = readJsonFromFile<Record<string, SpecializationData>>(specializationDataFile)
const translations = readJsonFromFile<Record<string, Record<string, string>>>(translationDataFile)

const languages = ArrayUtils.toRecord(
  Object.entries(languageData).map<Language>(([idString, entity]) => ({
    ...entity,
    id: parseInt(idString),
    emoji: entity.emoji.map(str => String.fromCodePoint(parseInt(str))).join(''),
  })),
  language => language.id,
)

const emojis = Object.entries(emojiData).map<Emoji>(([idString, entity]) => new Emoji(parseInt(idString), entity))

const roles = ArrayUtils.toRecord(
  Object.entries(roleData).map<Role>(([idString, entity]) => ({
    ...entity,
    id: parseInt(idString),
    emoji: emojis[entity.emoji],
  })),
  role => role.id,
)

const playerClasses = ArrayUtils.toRecord(
  Object.entries(playerClassData).map<PlayerClass>(([idString, entity]) => ({
    ...entity,
    id: parseInt(idString),
    emoji: emojis[entity.emoji],
    specializations: [],
  })),
  playerClass => playerClass.id,
)

const specializations = ArrayUtils.toRecord(
  Object.entries(specializationData).map<Specialization>(([idString, entity]) => ({
    ...entity,
    id: parseInt(idString),
    playerClass: playerClasses[entity.playerClass]!,
    role: roles[entity.role]!,
    emoji: emojis[entity.emoji],
  })),
  spec => spec.id,
)

Object.values(playerClasses).forEach(playerClass => {
  playerClass.specializations = Object.values(specializations).filter(spec => spec.playerClass.id === playerClass.id)
})

export { commands, emojis, languages, playerClasses, specializations, roles, translations }
