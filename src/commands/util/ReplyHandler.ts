import {
  ButtonInteraction,
  InteractionCallbackResponse,
  MessageComponentInteraction,
  StringSelectMenuInteraction,
} from 'discord.js'

const TIMEOUT_DURATION_IN_MS = 60_000

export type StringSelectMenuInteractionHandler = (interaction: StringSelectMenuInteraction) => void | Promise<void>
export type ButtonInteractionHandler = (interaction: ButtonInteraction) => void | Promise<void>

export default class ReplyHandler {
  private selectionHandlers: Record<string, StringSelectMenuInteractionHandler> = {}
  private buttonClickHandlers: Record<string, ButtonInteractionHandler> = {}

  addSelectionHandler = (customId: string, handler: StringSelectMenuInteractionHandler): ReplyHandler => {
    this.selectionHandlers[customId] = handler
    return this
  }

  addClickHandler = (customId: string, handler: ButtonInteractionHandler): ReplyHandler => {
    this.buttonClickHandlers[customId] = handler
    return this
  }

  handle = async (
    reply: InteractionCallbackResponse,
    options?: { onTimeOut?: () => unknown | Promise<unknown> },
  ): Promise<void> => {
    if (reply.resource === null || reply.resource.message === null) throw new Error('Unexpected error')

    let userResponse: MessageComponentInteraction
    try {
      userResponse = await reply.resource.message.awaitMessageComponent({ time: TIMEOUT_DURATION_IN_MS })
    } catch {
      await options?.onTimeOut?.()
      return
    }

    if (userResponse.isStringSelectMenu()) {
      const handler = this.selectionHandlers[userResponse.customId]
      handler?.(userResponse)
    }

    if (userResponse.isButton()) {
      const handler = this.buttonClickHandlers[userResponse.customId]
      handler?.(userResponse)
    }
  }
}
