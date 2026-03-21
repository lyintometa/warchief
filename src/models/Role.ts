import type Emoji from './Emoji'

export default interface Role {
  id: number
  identifier: string
  emoji: Emoji
  displayIndex: number
  description: Record<string, string>
}

export interface RoleData {
  identifier: string
  emoji: number
  displayIndex: number
  description: Record<string, string>
}
