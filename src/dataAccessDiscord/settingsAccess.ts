import { Channel, Guild, Locale, Message } from 'discord.js'

import { languages } from '../dataAccess/dataAccess.js'
import Settings from '../models/Settings.js'
import DataAccess from './dataAccess.js'

const prefix = 'setting-data'

export default class SettingsAccess {
  #dataAccess?: DataAccess
  #data: Settings = { locale: languages[0].locale, tables: {} }
  #messagesTable: Message[] = []

  init = async (guild: Guild) => {
    this.#dataAccess = new DataAccess(prefix)
    this.#data = { locale: languages[0].locale, tables: {} }
    const readSettings = await this.#dataAccess.read<Settings>(guild)
    if (readSettings !== undefined) this.#data = readSettings
    this.#messagesTable = await this.#aquireMessages(guild)
  }

  getTableData = () => this.#data.tables

  get tables() {
    return this.#data.tables
  }

  get language() {
    return this.#data.locale
  }

  get messagesTable() {
    return this.#messagesTable
  }

  addTableMessage = async (message: Message) => {
    this.#messagesTable.push(message)
    this.#data.tables[message.channelId] = message.id
    await this.#dataAccess?.write(this.#data)
  }

  updateLanguage = async (locale: Locale) => {
    this.#data.locale = locale
    await this.#dataAccess?.write(this.#data)
  }

  deleteTable = async (message: Message<true>) => {
    if (this.#data.tables[message.channelId] !== message.id) return
    delete this.#data.tables[message.channelId]
    this.#messagesTable = this.#messagesTable.filter(_ => _.id !== message.id)
    await this.#dataAccess?.write(this.#data)
  }

  deleteTableChannel = async (channel: Channel) => {
    delete this.#data.tables[channel.id]
    this.#messagesTable = this.#messagesTable.filter(_ => _.channelId !== channel.id)
    await this.#dataAccess?.write(this.#data)
  }

  #aquireMessages = async (guild: Guild) =>
    (
      await Promise.all(
        Object.keys(this.#data.tables).map(async channelId => {
          const channel = guild.channels.cache.get(channelId)
          if (channel === undefined) {
            delete this.#data.tables[channelId]
            return
          }

          if (!channel.isTextBased()) return

          const allMessages = await channel.messages.fetch()
          const message = allMessages.find(_ => _.id == this.#data.tables[channelId])
          if (!message) delete this.#data.tables[channelId]
          return message
        }),
      )
    ).filter(_ => _ !== undefined)
}
