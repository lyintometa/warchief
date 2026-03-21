import type {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

export default interface ClientCommand {
  data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder
  execute?: (interaction: ChatInputCommandInteraction<'raw' | 'cached'>) => Promise<any> | any
}
