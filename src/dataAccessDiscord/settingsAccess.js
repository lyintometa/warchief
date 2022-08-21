import { languages } from '../dataAccess/dataAccess.js'
import DataAccess from './dataAccess.js'

const prefix = 'setting-data'

export default class SettingsAccess {
  #dataAccess
  #data
  #messagesTable = []

  init = async guild => {
    this.#dataAccess = new DataAccess(prefix)
    this.#data = await this.#dataAccess.read(guild)
    if (!this.#data.tables) this.#data.tables = {}
    if (!this.#data.language) this.#data.language = languages[0].locale
    this.#messagesTable = await this.#aquireMessages(guild)
  }

  getTableData = () => this.#data.tables

  get tables() {
    return this.#data.tables
  }

  get language() {
    return this.#data.language
  }

  get messagesTable() {
    return this.#messagesTable
  }

  addTableMessage = async message => {
    this.#messagesTable.push(message)
    this.#data.tables[message.channelId] = message.id
    await this.#dataAccess.write(this.#data)
  }

  updateLanguage = async language => {
    this.#data.language = language.locale
    await this.#dataAccess.write(this.#data)
  }

  deleteTable = async message => {
    if (this.#data.tables[message.channelId] !== message.id) return
    delete this.#data.tables[message.channelId]
    this.#messagesTable = this.#messagesTable.filter(_ => _.id !== message.id)
    await this.#dataAccess.write(this.#data)
  }

  deleteTableChannel = async channel => {
    delete this.#data.tables[channel.id]
    this.#messagesTable = this.#messagesTable.filter(_ => _.channelId !== channel.id)
    await this.#dataAccess.write(this.#data)
  }

  #aquireMessages = async guild =>
    (
      await Promise.all(
        Object.keys(this.#data.tables).map(async channelId => {
          const channel = guild.channels.cache.find(_ => _.id == channelId)
          if (!channel) delete this.#data.tables[channelId]
          const allMessages = await channel.messages.fetch()
          const message = allMessages.find(
            _ => _.id == this.#data.tables[channelId]
          )
          if (!message) delete this.#data.tables[channelId]
          return message
        })
      )
    ).filter(_ => _ !== undefined)
}
