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
} from 'discord.js'

import { text } from '../i18n/text.js'
import ClientCommand from '../models/ClientCommand.js'
import languageService from '../service/languageService.js'
import service from '../service/playerClassService.js'
import ReplyHandler from './util/ReplyHandler.js'
import { setDefaultOption } from './util/util.js'

const SELECT_CLASS_MENU_CUSTOM_ID = 'class-select'
const SELECT_SPEC_MENU_CUSTOM_ID = 'spec-select'
const SELECT_ROLE_MENU_CUSTOM_ID = 'role-select'
const CONFIRM_BUTTON_CUSTOM_ID = 'confirm-button'

const NOT_SURE_OPTION = 13

export default {
  data: new SlashCommandBuilder().setName('class_select').setDescription('Sag mir deine Klasse fürs Addon'),
  async execute(interaction: ChatInputCommandInteraction<'raw' | 'cached'>) {
    const { guildId, user } = interaction
    const locale = languageService.getGuildLanguage(guildId).locale

    const replyHandler = new ReplyHandler()
      .addSelectionHandler(SELECT_CLASS_MENU_CUSTOM_ID, handleClassSelected)
      .addSelectionHandler(SELECT_SPEC_MENU_CUSTOM_ID, handleSpecSelected)
      .addSelectionHandler(SELECT_ROLE_MENU_CUSTOM_ID, handleRoleSelected)
      .addClickHandler(CONFIRM_BUTTON_CUSTOM_ID, handleConfirm)

    let playerClassId = 0
    let specId = 0
    let roleId = 0

    const reply = await interaction.reply({
      content: text(locale, 'chooseClass'),
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SELECT_CLASS_MENU_CUSTOM_ID)
            .setPlaceholder(text(locale, 'class'))
            .addOptions(service.getClassSelectOptions(guildId)),
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

    async function handleClassSelected(interaction: StringSelectMenuInteraction) {
      playerClassId = parseInt(interaction.values[0])

      const classSelectRow = interaction.message.components[0] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(classSelectRow.components[0], interaction.values[0])

      if (playerClassId === NOT_SURE_OPTION) {
        const reply = await interaction.update({
          content: text(locale, 'chooseRole'),
          components: [
            classSelectRow,
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(SELECT_ROLE_MENU_CUSTOM_ID)
                .setPlaceholder(text(locale, 'role'))
                .addOptions(service.getRoleSelectOptions(guildId)),
            ),
          ],
          withResponse: true,
        })

        await replyHandler.handle(reply, {
          onTimeOut: () =>
            interaction.editReply({
              content: 'No selection made within 1 minute, cancelling...',
              components: [],
            }),
        })
      } else {
        const reply = await interaction.update({
          content: text(locale, 'chooseSpec'),
          components: [
            classSelectRow,
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(SELECT_SPEC_MENU_CUSTOM_ID)
                .setPlaceholder(text(locale, 'spec'))
                .addOptions(service.getSpecSelectOptions(guildId, interaction.values[0])),
            ),
          ],
          withResponse: true,
        })

        await replyHandler.handle(reply, {
          onTimeOut: () =>
            interaction.editReply({
              content: 'No selection made within 1 minute, cancelling...',
              components: [],
            }),
        })
      }
    }

    async function handleSpecSelected(interaction: StringSelectMenuInteraction) {
      specId = parseInt(interaction.values[0])

      const specSelectRow = interaction.message.components[1] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(specSelectRow.components[0], interaction.values[0])

      const reply = await interaction.update({
        content: text(locale, 'confirmSpec'),
        components: [
          interaction.message.components[0],
          specSelectRow,
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(CONFIRM_BUTTON_CUSTOM_ID)
              .setLabel(text(locale, 'confirm'))
              .setStyle(ButtonStyle.Success),
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

    async function handleRoleSelected(interaction: StringSelectMenuInteraction) {
      roleId = parseInt(interaction.values[0])

      const roleSelectRow = interaction.message.components[1] as ActionRow<StringSelectMenuComponent>
      setDefaultOption(roleSelectRow.components[0], interaction.values[0])

      const reply = await interaction.update({
        content: text(locale, 'confirmRole'),
        components: [
          interaction.message.components[0],
          roleSelectRow,
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(CONFIRM_BUTTON_CUSTOM_ID)
              .setLabel(text(locale, 'confirm'))
              .setStyle(ButtonStyle.Success),
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
      if (playerClassId === NOT_SURE_OPTION) {
        const newRole = await service.createOrUpdateRole(guildId, user, roleId)
        await interaction.update({
          content: `${text(locale, 'yourSelect')}:
          \n${newRole.emoji} ${newRole.description[locale]}
          \n${text(locale, 'canChange')}`,
          components: [],
        })

        return
      }

      const newSpec = await service.createOrUpdate(guildId, user, playerClassId, specId)
      await interaction.update({
        content: `${text(locale, 'yourSelect')}:
        \n${newSpec.playerClass.emoji} ${newSpec.playerClass.description[locale]} - ${newSpec.emoji} ${newSpec.description[locale]}
        \n${text(locale, 'canChange')}`,
        components: [],
      })
    }
  },
} satisfies ClientCommand
