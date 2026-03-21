import type Emoji from './Emoji'
import type PlayerClass from './PlayerClass'
import type Role from './Role'

export default interface Specialization {
  id: number
  identifier: string
  playerClass: PlayerClass
  role: Role
  emoji: Emoji
  description: Record<string, string>
}

export interface SpecializationData {
  identifier: string
  playerClass: number
  role: number
  emoji: number
  description: Record<string, string>
}
