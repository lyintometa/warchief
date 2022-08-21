const dataMarker = '#'
const placeHolder = '_'
const newLine = '\n'
const charLimit = 2000
const dbChannelName = '_db_warchief'

export default class DataAccess {
  #channel
  #prefix
  #messages

  constructor(prefix) {
    if (!prefix) throw new Error('No prefix supplied')
    this.#prefix = prefix
  }

  read = async guild => {
    this.#channel = await this.#getOrCreateDbChannel(guild)
    const messageCollection = await this.#aquireMessages()
    this.#messages = [...messageCollection.values()]
    if (this.#messages.length === 0) return {}
    const data = this.#messages.map(_ => this.#getContent(_)).join('')
    return JSON.parse(data)
  }

  write = async data => {
    await this.#messages ///??
    const contents = this.#splitDataString(JSON.stringify(data))
    for (let i = 0; i < contents.length; i++) {
        if (this.#messages[i]){
            this.#messages[i].edit(contents[i])
            return
        }
        const message = await this.#channel.send(contents[i])
        this.#messages.push(message)
    }
    const messagesToDelete = this.#messages.slice(contents.length)
    messagesToDelete.forEach(_ => {
      _.delete()
    })
  }

  #aquireMessages = async () => {
    const allMessages = await this.#channel.messages.fetch()
    const unsortedMessages = allMessages.filter(_ =>
      _.content.startsWith(dataMarker + this.#prefix)
    )
    return unsortedMessages.sort(
      (a, b) => this.#getIndex(a) - this.#getIndex(b)
    )
  }

  #getContent = message => {
    const content = message.content
    var endOfIndex = content.indexOf(newLine)
    return content.substring(endOfIndex + newLine.length)
  }

  #getIndex = message => {
    const content = message.content
    var startOfIndex =
      content.indexOf(this.#prefix) + this.#prefix.length + placeHolder.length
    var endOfIndex = content.indexOf(newLine)
    var index = parseInt(content.substring(startOfIndex, endOfIndex))
    if (isNaN(index))
      throw new Error(
        `Index could not be parsed for message '${message.id}' (content: '${message.content}')`
      )
    return index
  }

  #splitDataString = dataString => {
    const parts = []
    do {
      const fullPrefix = this.#getFullPrefix(parts.length)
      parts.push(
        fullPrefix + dataString.slice(0, charLimit - fullPrefix.length)
      )
      dataString = dataString.slice(charLimit - fullPrefix.length)
    } while (dataString)
    return parts
  }

  #getFullPrefix = messageNumber =>
    `${dataMarker}${this.#prefix}${placeHolder}${messageNumber}${newLine}`

  #getOrCreateDbChannel = async guild => {
    var dbchannel = guild.channels.cache.find(_ => _.name == dbChannelName)
    if (!dbchannel) {
      return await guild.channels.create(dbChannelName, {
        type: 'text',
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES']
          }
        ]
      })
    }
    return dbchannel
  }
}
