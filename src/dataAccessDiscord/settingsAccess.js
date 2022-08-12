import { EmbedBuilder } from '@discordjs/builders'
import data from '../dataAccess/dataAccess.js'
import DataAccess from './dataAccess.js'

const prefix = 'setting-data'

export default class SettingsAccess {
  #dataAccess
  #data
  playerData
  messagesTable = []

  init = async (guild, playerData) => {
    this.#dataAccess = new DataAccess(prefix)
    this.#data = await this.#dataAccess.read(guild)
    if (!this.#data.tables) this.#data.tables = {}
    this.playerData = playerData
    this.messagesTable = await this.#aquireMessages(guild)
  }

  getTableData = () => this.#data.tables

  createTable = channel => {
    if (this.#data.tables[channel.id]) return
    return this.#constructTableEmbed().data    
  }

  addTableMessage = async message => {
    this.messagesTable.push(message)
    this.#data.tables[message.channelId] = message.id
    await this.#dataAccess.write(this.#data)
  }

  updatePlayerData = async playerData => {
    this.playerData = playerData
    var table = this.#constructTableEmbed().data    
    await Promise.all(this.messagesTable.map(_ => _.edit({ embeds: [table] })))
  }

  deleteTable = async channelId => {
    delete this.#data.tables[channelId]
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

  #constructTableEmbed = () => new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Raidkader')
      .setDescription(this.#constructTable() + '\u200b')
      .addFields({ name: 'Befehle', value: "`/klasse` - Füg deine Klasse hinzu\n`/klassen_entfernen` - Lösche deine Klasse" })

  #constructTable = () => Object.keys(this.playerData).sort(this.#byRole).map(playerId => {
      const playerSpec = data.specializations[this.playerData[playerId].specialization]
      const playerClass = playerSpec.playerClass
      const playerRole = playerSpec.role
      return `${playerRole.emoji} ${playerClass.emoji}${playerSpec.emoji} ${this.playerData[playerId].name}\n`
    }).join('\n')

  #byRole = (a, b) => {
    const playerSpecA = data.specializations[this.playerData[a].specialization]
    const playerSpecB = data.specializations[this.playerData[b].specialization]
    const classA = playerSpecA.playerClass
    const classB = playerSpecB.playerClass
    const roleA = classA.getSpec(this.playerData[a].specialization).role
    const roleB = classB.getSpec(this.playerData[b].specialization).role
    if (roleA.displayIndex != roleB.displayIndex) return roleA.displayIndex - roleB.displayIndex;
    if (classA.id != classB.id) return classA.id - classB.id;
    var playerNamesSorted = [this.playerData[a].name, this.playerData[b].name].sort()
    return playerNamesSorted.indexOf(this.playerData[a].name) - playerNamesSorted.indexOf(this.playerData[b].name);      
  }
}
