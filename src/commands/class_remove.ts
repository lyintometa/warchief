import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'

import { text } from '../i18n/text.js'
import ClientCommand from '../models/ClientCommand.js'
import languageService from '../service/languageService.js'
import service from '../service/playerClassService.js'
import ReplyHandler from './util/ReplyHandler.js'

const CONFIRM_BUTTON_ID = 'confirm-button'

export default {
  data: new SlashCommandBuilder().setName('class_remove').setDescription('Entferne deine Klasse'),
  async execute(interaction: ChatInputCommandInteraction<'raw' | 'cached'>) {
    const { guildId, user } = interaction
    const locale = languageService.getGuildLanguage(guildId).locale

    const replyHandler = new ReplyHandler().addClickHandler(CONFIRM_BUTTON_ID, handleConfirm)

    const reply = await interaction.reply({
      content: text(locale, 'sure'),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(CONFIRM_BUTTON_ID).setLabel(text(locale, 'yes')).setStyle(ButtonStyle.Danger),
        ),
      ],
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    })

    await replyHandler.handle(reply, {
      onTimeOut: () =>
        interaction.editReply({
          content: 'Confirmation not received within 1 minute, cancelling...',
          components: [],
        }),
    })

    async function handleConfirm(interaction: ButtonInteraction) {
      service.delete(guildId, user)

      await interaction.update({
        content: text(locale, 'classRemoved'),
        components: [],
      })
    }
  },
} satisfies ClientCommand
