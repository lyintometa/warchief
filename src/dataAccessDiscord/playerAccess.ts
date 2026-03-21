import { Guild, User } from 'discord.js'

import PlayerClass from '../models/PlayerClass.js'
import Role from '../models/Role.js'
import Specialization from '../models/Specialization.js'
import DataAccess from './dataAccess.js'
import PlayerEntity from './entities/PlayerEntity.js'

const prefix = 'player-data'

/* interface PlayerAccess {
  playerData: PlayerData
} */

export default class PlayerAccess {
  #dataAccess?: DataAccess
  #data: Record<string, PlayerEntity> = {}

  init = async (guild: Guild) => {
    this.#dataAccess = new DataAccess(prefix)
    this.#data = {}
    const newData = await this.#dataAccess.read<Record<string, PlayerEntity>>(guild)
    if (newData !== undefined) this.#data = newData
  }

  getPlayerData = () => this.#data

  get playerData() {
    return this.#data
  }

  createOrUpdate = async (user: User, playerClass: PlayerClass, playerSpec: Specialization) => {
    if (!this.#data[user.id]) this.#data[user.id] = new PlayerEntity(user)
    this.#data[user.id].class = playerClass.id
    this.#data[user.id].specialization = playerSpec.id
    delete this.#data[user.id].role
    await this.#dataAccess?.write(this.#data)
  }

  createOrUpdateRole = async (user: User, role: Role) => {
    if (!this.#data[user.id]) this.#data[user.id] = new PlayerEntity(user)
    delete this.#data[user.id].class
    delete this.#data[user.id].specialization
    this.#data[user.id].role = role.id
    await this.#dataAccess?.write(this.#data)
  }

  delete = async (user: User) => {
    delete this.#data[user.id]
    await this.#dataAccess?.write(this.#data)
  }
}
