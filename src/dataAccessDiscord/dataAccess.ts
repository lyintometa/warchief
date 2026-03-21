import { ChannelType, Collection, Guild, Message, PermissionFlagsBits, TextChannel } from 'discord.js'

const dataMarker = '#'
const placeHolder = '_'
const newLine = '\n'
const charLimit = 2000
const dbChannelName = '_db_warchief'

export default class DataAccess {
  #channel?: TextChannel
  #prefix: string
  #messages?: Message<true>[]

  constructor(prefix: string) {
    if (!prefix) throw new Error('No prefix supplied')
    this.#prefix = prefix
  }

  read = async <T>(guild: Guild): Promise<T | undefined> => {
    this.#channel = await this.#getOrCreateDbChannel(guild)
    const messageCollection = await this.#aquireMessages()
    this.#messages = [...messageCollection.values()]
    if (this.#messages.length === 0) return undefined
    const data = this.#messages.map(_ => this.#getContent(_)).join('')
    return JSON.parse(data)
  }

  write = async (data: unknown) => {
    if (this.#channel === undefined) throw new Error('Expected channel to be initialized but it is not')
    if (this.#messages === undefined) throw new Error('Expected messages to be initialized but they are not')
    await this.#messages ///??
    const contents = this.#splitDataString(JSON.stringify(data))
    for (let i = 0; i < contents.length; i++) {
      if (this.#messages[i]) {
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

  #aquireMessages = async (): Promise<Collection<string, Message<true>>> => {
    if (this.#channel === undefined) throw new Error('Expected channel to be initialized but it is not')
    const allMessages = await this.#channel.messages.fetch()
    const unsortedMessages = allMessages.filter(_ => _.content.startsWith(dataMarker + this.#prefix))
    return unsortedMessages.sort((a, b) => this.#getIndex(a) - this.#getIndex(b))
  }

  #getContent = (message: Message) => {
    const content = message.content
    var endOfIndex = content.indexOf(newLine)
    return content.substring(endOfIndex + newLine.length)
  }

  #getIndex = (message: Message) => {
    const content = message.content
    var startOfIndex = content.indexOf(this.#prefix) + this.#prefix.length + placeHolder.length
    var endOfIndex = content.indexOf(newLine)
    var index = parseInt(content.substring(startOfIndex, endOfIndex))
    if (isNaN(index))
      throw new Error(`Index could not be parsed for message '${message.id}' (content: '${message.content}')`)
    return index
  }

  #splitDataString = (dataString: string) => {
    const parts = []
    do {
      const fullPrefix = this.#getFullPrefix(parts.length)
      parts.push(fullPrefix + dataString.slice(0, charLimit - fullPrefix.length))
      dataString = dataString.slice(charLimit - fullPrefix.length)
    } while (dataString)
    return parts
  }

  #getFullPrefix = (messageNumber: number) => `${dataMarker}${this.#prefix}${placeHolder}${messageNumber}${newLine}`

  #getOrCreateDbChannel = async (guild: Guild): Promise<TextChannel> => {
    var dbChannel = guild.channels.cache.find(_ => _.name == dbChannelName)
    if (dbChannel !== undefined) return dbChannel as TextChannel

    return await guild.channels.create({
      name: dbChannelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: guild.roles.cache.find(role => role.name === 'Warchief')!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    })
  }
}
