import type { Client, Collection } from 'discord.js'

import ClientCommand from './ClientCommand'

export interface ClientExtended<Ready extends boolean = boolean> extends Client<Ready> {
  commands: Collection<string, ClientCommand>
}
