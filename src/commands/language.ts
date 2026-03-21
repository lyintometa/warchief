import {
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js'

import { languages } from '../dataAccess/dataAccess.js'
import { text } from '../i18n/text.js'
import ClientCommand from '../models/ClientCommand.js'
import languageService from '../service/languageService.js'
import ReplyHandler from './util/ReplyHandler.js'
import { setDefaultOption } from './util/util.js'

const SELECT_LANGUAGE_MENU_ID = 'language-select'
const CONFIRM_BUTTON_ID = 'confirm-button'

export default {
  data: new SlashCommandBuilder().setName('language').setDescription('Change the language of the bot'),
  execute: async (interaction: ChatInputCommandInteraction<'raw' | 'cached'>) => {
    const { guildId } = interaction
    const currentLanguageId = languageService.getGuildLanguage(guildId).id

    const replyHandler = new ReplyHandler()
      .addSelectionHandler(SELECT_LANGUAGE_MENU_ID, handleLanguageSelected)
      .addClickHandler(CONFIRM_BUTTON_ID, handleConfirm)

    let newLanguageId = currentLanguageId

    const reply = await interaction.reply({
      content: 'Choose the language:',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SELECT_LANGUAGE_MENU_ID)
            .setPlaceholder('Language')
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setValue(currentLanguageId.toString())
                .setLabel(languages[currentLanguageId].description)
                .setEmoji(String.fromCodePoint(0x2705)),
              ...Object.values(languages)
                .filter(language => language.id !== currentLanguageId)
                .map(language =>
                  new StringSelectMenuOptionBuilder()
                    .setValue(language.id.toString())
                    .setLabel(language.description)
                    .setEmoji(language.emoji),
                ),
            ),
        ),
      ],
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    })

    await replyHandler.handle(reply, {
      onTimeOut: () =>
        interaction.editReply({
          content: 'No selection made within 1 minute, cancelling...',
          components: [],
        }),
    })

    async function handleLanguageSelected(interaction: StringSelectMenuInteraction) {
      newLanguageId = parseInt(interaction.values[0])

      const languageSelectRow = interaction.message.components[0] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(languageSelectRow.components[0], interaction.values[0])

      const reply = await interaction.update({
        content: 'Confirm your choice:',
        components: [
          languageSelectRow,
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(CONFIRM_BUTTON_ID).setLabel('Confirm').setStyle(ButtonStyle.Success),
          ),
        ],
        withResponse: true,
      })

      await replyHandler.handle(reply, {
        onTimeOut: () =>
          interaction.editReply({
            content: 'Confirmation not received within 1 minute, cancelling...',
            components: [],
          }),
      })
    }

    async function handleConfirm(interaction: ButtonInteraction) {
      const newLanguage = languageService.setGuildLanguage(guildId, newLanguageId)
      await interaction.update({
        content: `${text(newLanguage.locale, 'newLanguage')}: \n${newLanguage.emoji} ${newLanguage.description}`,
        components: [],
      })
    }
  },
} satisfies ClientCommand
