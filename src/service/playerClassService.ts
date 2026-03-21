import { APISelectMenuOption, Snowflake, User } from 'discord.js'

import { languages, playerClasses, roles, specializations } from '../dataAccess/dataAccess.js'
import { getGuildSettings, getGuildPlayerData } from '../dataAccessDiscord/dataAccessDiscordService.js'
import Role from '../models/Role.js'
import Specialization from '../models/Specialization.js'
import raidTableService from './raidTableService.js'

class PlayerClassService {
  #classSelectOptions: Record<string, APISelectMenuOption[]> = {}
  #specSelectOptions: Record<string, Record<string, APISelectMenuOption[]>> = {}
  #roleSelectOptions: Record<string, APISelectMenuOption[]> = {}

  constructor() {
    this.#initClassSelectOptions()
    this.#initSpecSelectOptions()
    this.#initRoleSelectOptions()
  }

  getClassSelectOptions = (guildId: Snowflake) => this.#classSelectOptions[getGuildSettings(guildId).language]

  getSpecSelectOptions = (guildId: Snowflake, classId: string) =>
    this.#specSelectOptions[getGuildSettings(guildId).language][classId]

  getRoleSelectOptions = (guildId: Snowflake) => this.#roleSelectOptions[getGuildSettings(guildId).language]

  createOrUpdate = async (
    guildId: Snowflake,
    user: User,
    playerClassId: number,
    specializationId: number,
  ): Promise<Specialization> => {
    const playerClass = playerClasses[playerClassId]
    const specialization = specializations[specializationId]
    await getGuildPlayerData(guildId).createOrUpdate(user, playerClass, specialization)
    raidTableService.updateTables(guildId)
    return specialization
  }

  createOrUpdateRole = async (guildId: Snowflake, user: User, roleId: number): Promise<Role> => {
    const role = roles[roleId]
    await getGuildPlayerData(guildId).createOrUpdateRole(user, role)
    raidTableService.updateTables(guildId)
    return role
  }

  delete = async (guildId: Snowflake, user: User) => {
    await getGuildPlayerData(guildId).delete(user)
    raidTableService.updateTables(guildId)
  }

  #initClassSelectOptions = () =>
    Object.values(languages).forEach(language => {
      const locale = languages[language.id].locale
      this.#classSelectOptions[locale] = Object.values(playerClasses).map(playerClass => ({
        value: playerClass.id.toString(),
        emoji: playerClass.emoji.toAPIMessageComponent(),
        label: playerClass.description[locale] ?? 'undefined',
      }))
    })

  #initSpecSelectOptions = () =>
    Object.values(languages).forEach(language => {
      const locale = language.locale
      this.#specSelectOptions[locale] = {}
      Object.values(playerClasses).forEach(playerClass => {
        this.#specSelectOptions[locale][playerClass.id] = playerClass.specializations.map(spec => ({
          value: spec.id.toString(),
          description: spec.role.description[locale],
          emoji: spec.emoji.toAPIMessageComponent(),
          label: spec.description[locale] ?? 'undefined',
        }))
      })
    })

  #initRoleSelectOptions = () =>
    Object.values(languages).forEach(language => {
      const locale = language.locale
      this.#roleSelectOptions[locale] = Object.values(roles).map<APISelectMenuOption>(role => ({
        value: role.id.toString(),
        emoji: role.emoji.toAPIMessageComponent(),
        label: role.description[locale] ?? 'undefined',
      }))
    })
}

export default new PlayerClassService()
