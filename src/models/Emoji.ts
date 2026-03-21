import { APIMessageComponentEmoji } from 'discord.js'

export default class Emoji {
  id: number
  name: string
  discordId?: string

  constructor(id: number, data: EmojiData) {
    this.id = id
    this.name = data.name
    this.discordId = data.discordId
  }

  toAPIMessageComponent = (): APIMessageComponentEmoji => ({
    id: this.discordId,
    name: this.name,
  })

  toString = () => (this.discordId !== undefined ? `<:${this.name}:${this.discordId}>` : `:${this.name}:`)
}

export interface EmojiData {
  name: string
  discordId: string
}
