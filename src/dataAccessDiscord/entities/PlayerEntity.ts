import { User } from 'discord.js'

export default class PlayerEntity {
  name
  class?: number
  specialization?: number
  role?: number

  constructor(user: User) {
    this.name = user.username
  }
}
