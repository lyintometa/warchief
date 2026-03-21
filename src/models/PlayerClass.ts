import type Emoji from './Emoji'
import type Specialization from './Specialization'

export default interface PlayerClass {
  id: number
  identifier: string
  emoji: Emoji
  description: Record<string, string>
  specializations: Specialization[]
}

export interface PlayerClassData {
  identifier: string
  emoji: number
  description: Record<string, string>
}
