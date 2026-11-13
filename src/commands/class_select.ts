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
} from 'discord.js'

import ClientCommand from '../models/ClientCommand.js'
import service from '../service/playerClassService.js'
import { commonTexts, t } from '../utils/translationUtils.js'
import ReplyHandler from './util/ReplyHandler.js'
import { setDefaultOption } from './util/util.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'class_select',
    [Locale.German]: 'klasse_wählen',
  },
  description: {
    [Locale.EnglishGB]: 'Select the class you will play in the raid',
    [Locale.German]: 'Wähle die Klasse, die du im Raid spielen wirst',
  },
  'selectClass.content': {
    [Locale.EnglishGB]: 'Select the class:',
    [Locale.German]: 'Wähle die Klasse:',
  },
  'selectClass.component.selectMenu.placeholder': {
    [Locale.EnglishGB]: 'Class',
    [Locale.German]: 'Klasse',
  },
  'selectSpecialization.content': {
    [Locale.EnglishGB]: 'Select the specialization:',
    [Locale.German]: 'Wähle die Spezialisierung:',
  },
  'selectSpecialization.component.selectMenu.placeholder': {
    [Locale.EnglishGB]: 'Specialization',
    [Locale.German]: 'Spezialisierung',
  },
  'selectRole.content': {
    [Locale.EnglishGB]: 'Select the role:',
    [Locale.German]: 'Wähle die Rolle:',
  },
  'selectRole.component.selectMenu.placeholder': {
    [Locale.EnglishGB]: 'Role',
    [Locale.German]: 'Rolle',
  },
  'confirmSpecialization.content': {
    [Locale.EnglishGB]: 'Confirm your specialization',
    [Locale.German]: 'Bestätige deine Spezialisierung',
  },
  'confirmRole.content': {
    [Locale.EnglishGB]: 'Confirm your role',
    [Locale.German]: 'Bestätige deine Rolle',
  },
  'confirmation.content': {
    [Locale.EnglishGB]: 'Your selection',
    [Locale.German]: 'Deine Auswahl',
  },
  'confirmation.content.subtext': {
    [Locale.EnglishGB]: 'You can change your selection any time',
    [Locale.German]: 'Du kannst deine Auswahl jederzeit ändern',
  },
}

const SELECT_CLASS_MENU_CUSTOM_ID = 'class-select'
const SELECT_SPEC_MENU_CUSTOM_ID = 'spec-select'
const SELECT_ROLE_MENU_CUSTOM_ID = 'role-select'
const CONFIRM_BUTTON_CUSTOM_ID = 'confirm-button'

const NOT_SURE_OPTION = 13

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

    const replyHandler = new ReplyHandler().addSelectionHandler(SELECT_CLASS_MENU_CUSTOM_ID, handleClassSelected)

    const reply = await interaction.reply({
      content: t(texts, locale, 'selectClass.content'),
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SELECT_CLASS_MENU_CUSTOM_ID)
            .setPlaceholder(t(texts, locale, 'selectClass.component.selectMenu.placeholder'))
            .addOptions(service.getClassSelectOptions(guild.id)),
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

    async function handleClassSelected(interaction: StringSelectMenuInteraction) {
      const playerClassId = parseInt(interaction.values[0])

      const classSelectRow = interaction.message.components[0] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(classSelectRow.components[0], interaction.values[0])

      const replyHandler = new ReplyHandler()
        .addSelectionHandler(SELECT_CLASS_MENU_CUSTOM_ID, handleClassSelected)
        .addSelectionHandler(SELECT_SPEC_MENU_CUSTOM_ID, handleSpecSelected)
        .addSelectionHandler(SELECT_ROLE_MENU_CUSTOM_ID, handleRoleSelected)

      if (playerClassId === NOT_SURE_OPTION) {
        const reply = await interaction.update({
          content: t(texts, locale, 'selectRole.content'),
          components: [
            classSelectRow,
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(SELECT_ROLE_MENU_CUSTOM_ID)
                .setPlaceholder(t(texts, locale, 'selectRole.component.selectMenu.placeholder'))
                .addOptions(service.getRoleSelectOptions(guild.id)),
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
      } else {
        const reply = await interaction.update({
          content: t(texts, locale, 'selectSpecialization.content'),
          components: [
            classSelectRow,
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(SELECT_SPEC_MENU_CUSTOM_ID)
                .setPlaceholder(t(texts, locale, 'selectSpecialization.component.selectMenu.placeholder'))
                .addOptions(service.getSpecSelectOptions(guild.id, interaction.values[0])),
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
      }

      async function handleSpecSelected(interaction: StringSelectMenuInteraction) {
        const specId = parseInt(interaction.values[0])

        const specSelectRow = interaction.message.components[1] as ActionRow<StringSelectMenuComponent>
        setDefaultOption(specSelectRow.components[0], interaction.values[0])

        const replyHandler = new ReplyHandler()
          .addSelectionHandler(SELECT_CLASS_MENU_CUSTOM_ID, handleClassSelected)
          .addSelectionHandler(SELECT_SPEC_MENU_CUSTOM_ID, handleSpecSelected)
          .addClickHandler(CONFIRM_BUTTON_CUSTOM_ID, handleConfirmSpecialization)

        const reply = await interaction.update({
          content: t(texts, locale, 'confirmSpecialization.content'),
          components: [
            interaction.message.components[0],
            specSelectRow,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(CONFIRM_BUTTON_CUSTOM_ID)
                .setLabel(t(commonTexts, locale, 'confirm'))
                .setStyle(ButtonStyle.Success),
            ),
          ],
          withResponse: true,
        })

        await replyHandler.handle(reply, {
          onTimeOut: () =>
            interaction.editReply({
              content: t(commonTexts, locale, 'confirmation.timeout'),
              components: [],
            }),
        })

        async function handleConfirmSpecialization(interaction: ButtonInteraction) {
          const newSpec = await service.createOrUpdate(guild, user, playerClassId, specId)

          await interaction.update({
            content: `${t(texts, locale, 'confirmation.content')}:
        \n${newSpec.playerClass.emoji} ${newSpec.playerClass.description[locale]} - ${newSpec.emoji} ${newSpec.description[locale]}
        \n${t(texts, locale, 'confirmation.content.subtext')}`,
            components: [],
          })
        }
      }

      async function handleRoleSelected(interaction: StringSelectMenuInteraction) {
        const roleId = parseInt(interaction.values[0])

        const roleSelectRow = interaction.message.components[1] as ActionRow<StringSelectMenuComponent>
        setDefaultOption(roleSelectRow.components[0], interaction.values[0])

        const replyHandler = new ReplyHandler()
          .addSelectionHandler(SELECT_CLASS_MENU_CUSTOM_ID, handleClassSelected)
          .addSelectionHandler(SELECT_ROLE_MENU_CUSTOM_ID, handleRoleSelected)
          .addClickHandler(CONFIRM_BUTTON_CUSTOM_ID, handleConfirmRole)

        const reply = await interaction.update({
          content: t(texts, locale, 'confirmRole.content'),
          components: [
            interaction.message.components[0],
            roleSelectRow,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(CONFIRM_BUTTON_CUSTOM_ID)
                .setLabel(t(commonTexts, locale, 'confirm'))
                .setStyle(ButtonStyle.Success),
            ),
          ],
          withResponse: true,
        })

        await replyHandler.handle(reply, {
          onTimeOut: () =>
            interaction.editReply({
              content: t(commonTexts, locale, 'confirmation.timeout'),
              components: [],
            }),
        })

        async function handleConfirmRole(interaction: ButtonInteraction) {
          const newRole = await service.createOrUpdateRole(guild, user, roleId)

          await interaction.update({
            content: `${t(texts, locale, 'confirmation.content')}:
          \n${newRole.emoji} ${newRole.description[locale]}
          \n${t(texts, locale, 'confirmation.content.subtext')}`,
            components: [],
          })
        }
      }
    }
  },
} satisfies ClientCommand
