import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionContextType,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'

import ClientCommand from '../models/ClientCommand.js'
import service from '../service/playerClassService.js'
import { commonTexts, t } from '../utils/translationUtils.js'
import ReplyHandler from './util/ReplyHandler.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'class_remove',
    [Locale.German]: 'klasse_entfernen',
  },
  description: {
    [Locale.EnglishGB]: 'Remove your class',
    [Locale.German]: 'Entferne deine Klasse',
  },
  'confirmation.content': {
    [Locale.EnglishGB]: 'Are you sure?',
    [Locale.German]: 'Bist du sicher?',
  },
  'classRemoved.content': {
    [Locale.EnglishGB]: 'Your class was removed!',
    [Locale.German]: 'Deine Klasse wurde entfernt!',
  },
}

const CONFIRM_BUTTON_ID = 'confirm-button'

export default {
  data: new SlashCommandBuilder()
    .setName(texts.name[Locale.EnglishGB])
    .setNameLocalizations(texts.name)
    .setDescription(texts.description[Locale.EnglishGB])
    .setDescriptionLocalizations(texts.description)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall),

  async execute(interaction: ChatInputCommandInteraction<'raw' | 'cached'>) {
    const { user, locale } = interaction

    if (!interaction.inCachedGuild()) {
      // ToDo (Future): Figure out if cache can be filled instead
      await interaction.reply({
        content: t(commonTexts, locale, 'command.onlyUsableInGuild'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const { guild } = interaction

    const replyHandler = new ReplyHandler().addClickHandler(CONFIRM_BUTTON_ID, handleConfirm)

    const reply = await interaction.reply({
      content: t(texts, locale, 'confirmation.content'),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(CONFIRM_BUTTON_ID)
            .setLabel(t(commonTexts, locale, 'yes'))
            .setStyle(ButtonStyle.Danger),
        ),
      ],
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    })

    await replyHandler.handle(reply, {
      onTimeOut: () =>
        interaction.editReply({
          content: t(commonTexts, locale, 'confirmation.timeout'),
          components: [],
        }),
    })

    async function handleConfirm(interaction: ButtonInteraction) {
      service.delete(guild, user)

      await interaction.update({
        content: t(texts, locale, 'classRemoved.content'),
        components: [],
      })
    }
  },
} satisfies ClientCommand
