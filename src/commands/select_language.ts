import {
  ActionRow,
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
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js'

import { languages } from '../dataAccess/dataAccess.js'
import ClientCommand from '../models/ClientCommand.js'
import languageService from '../service/languageService.js'
import { commonTexts, t } from '../utils/translationUtils.js'
import ReplyHandler from './util/ReplyHandler.js'
import { setDefaultOption } from './util/util.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'change_language',
    [Locale.German]: 'sprache_ändern',
  },
  description: {
    [Locale.EnglishGB]: 'Change the main language of the bot',
    [Locale.German]: 'Ändere die Hauptsprache des Bots',
  },
  'selectLanguage.content': {
    [Locale.EnglishGB]: 'Select the new language:',
    [Locale.German]: 'Wähle die neue Sprache:',
  },
  'selectLanguage.component.selectMenu.placeholder': {
    [Locale.EnglishGB]: 'Language',
    [Locale.German]: 'Sprache',
  },
  'confirmation.content': {
    [Locale.EnglishGB]: 'Confirm your choice:',
    [Locale.German]: 'Bestätige deine Auswahl:',
  },
  'newLanguage.content': {
    [Locale.EnglishGB]: "The warchief's new language",
    [Locale.German]: 'Die neue Sprache des Warchiefs',
  },
}

const SELECT_LANGUAGE_MENU_ID = 'language-select'
const CONFIRM_BUTTON_ID = 'confirm-button'

export default {
  data: new SlashCommandBuilder()
    .setName(texts.name[Locale.EnglishGB])
    .setNameLocalizations(texts.name)
    .setDescription(texts.description[Locale.EnglishGB])
    .setDescriptionLocalizations(texts.description)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall),

  execute: async (interaction: ChatInputCommandInteraction<'raw' | 'cached'>) => {
    const { locale } = interaction

    if (!interaction.inCachedGuild()) {
      // ToDo (Future): Figure out if cache can be filled instead
      await interaction.reply({
        content: t(commonTexts, locale, 'command.onlyUsableInGuild'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const { guild } = interaction

    const currentGuildLocale = languageService.getGuildLocale(guild.id)

    const replyHandler = new ReplyHandler().addSelectionHandler(SELECT_LANGUAGE_MENU_ID, handleLanguageSelected)

    const reply = await interaction.reply({
      content: t(texts, locale, 'selectLanguage.content'),
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SELECT_LANGUAGE_MENU_ID)
            .setPlaceholder(t(texts, locale, 'selectLanguage.component.selectMenu.placeholder'))
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setValue(currentGuildLocale)
                .setLabel(
                  Object.values(languages).find(language => language.locale === currentGuildLocale)?.description
                    ?? languages[0].description,
                )
                .setEmoji(String.fromCodePoint(0x2705)),
              ...Object.values(languages)
                .filter(language => language.locale !== currentGuildLocale)
                .map(language =>
                  new StringSelectMenuOptionBuilder()
                    .setValue(language.locale)
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
          content: t(commonTexts, locale, 'selection.timeout'),
          components: [],
        }),
    })

    async function handleLanguageSelected(interaction: StringSelectMenuInteraction) {
      const newGuildLocale = interaction.values[0] as Locale
      const newGuildLanguage =
        Object.values(languages).find(language => language.locale === newGuildLocale) ?? languages[0]

      const languageSelectRow = interaction.message.components[0] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(languageSelectRow.components[0], newGuildLocale)

      const replyHandler = new ReplyHandler()
        .addSelectionHandler(SELECT_LANGUAGE_MENU_ID, handleLanguageSelected)
        .addClickHandler(CONFIRM_BUTTON_ID, handleConfirm)

      const reply = await interaction.update({
        content: t(texts, locale, 'confirmation.content'),
        components: [
          languageSelectRow,
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(CONFIRM_BUTTON_ID)
              .setLabel(t(commonTexts, locale, 'confirm'))
              .setStyle(ButtonStyle.Success),
          ),
        ],
        withResponse: true,
      })

      await replyHandler.handle(reply, {
        onTimeOut: () =>
          interaction.editReply({
            content: t(commonTexts, locale, 'selection.timeout'),
            components: [],
          }),
      })

      async function handleConfirm(interaction: ButtonInteraction) {
        languageService.setGuildLanguage(guild, newGuildLocale)

        await interaction.update({
          content: `${t(texts, locale, 'newLanguage.content')}: \n${newGuildLanguage.emoji} ${newGuildLanguage.description}`,
          components: [],
        })
      }
    }
  },
} satisfies ClientCommand
