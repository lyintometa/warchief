import {
  ActionRow,
  ActionRowBuilder,
  APISelectMenuOption,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  InteractionContextType,
  Locale,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
} from 'discord.js'

import service from '../dataAccessDiscord/dataAccessDiscordService.js'
import ClientCommand from '../models/ClientCommand.js'
import playerClassService from '../service/playerClassService.js'
import { commonTexts, t } from '../utils/translationUtils.js'
import ReplyHandler from './util/ReplyHandler.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'remove_player',
    [Locale.German]: 'spieler_entfernen',
  },
  description: {
    [Locale.EnglishGB]: 'Remove a player from the table',
    [Locale.German]: 'Entferne einen Spieler aus der Tabelle',
  },
  'selectPlayer.content': {
    [Locale.EnglishGB]: 'Select the player to remove:',
    [Locale.German]: 'Wähle de Spieler, der entfernt werden soll:',
  },
  'selectPlayer.component.selectMenu.placeholder': {
    [Locale.EnglishGB]: 'Player',
    [Locale.German]: 'Spieler',
  },
  'confirmation.content': {
    [Locale.EnglishGB]: 'Confirm your choice:',
    [Locale.German]: 'Bestätige deine Auswahl:',
  },
  'playerRemoved.content': {
    [Locale.EnglishGB]: 'The player \`{0}\` was removed from the table.',
    [Locale.German]: 'Der Spieler \`{0}\` wurde aus der Tabelle entfernt.',
  },
}

const SELECT_PLAYER_MENU_CUSTOM_ID = 'player-select'
const CONFIRM_BUTTON_CUSTOM_ID = 'confirm-button'

export default {
  data: new SlashCommandBuilder()
    .setName(texts.name[Locale.EnglishGB])
    .setNameLocalizations(texts.name)
    .setDescription(texts.description[Locale.EnglishGB])
    .setDescriptionLocalizations(texts.description)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
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

    const replyHandler = new ReplyHandler().addSelectionHandler(SELECT_PLAYER_MENU_CUSTOM_ID, handlePlayerSelected)

    const reply = await interaction.reply({
      content: t(texts, locale, 'selectPlayer.content'),
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SELECT_PLAYER_MENU_CUSTOM_ID)
            .setPlaceholder(t(texts, locale, 'selectPlayer.component.selectMenu.placeholder'))
            .addOptions(
              Object.entries(service.getPlayerData(guild.id).playerData).map<APISelectMenuOption>(([id, value]) => ({
                label: value.name,
                value: id,
              })),
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

    async function handlePlayerSelected(interaction: StringSelectMenuInteraction) {
      const playerId = interaction.values[0]

      const playerSelectRow = interaction.message.components[0] as ActionRow<StringSelectMenuComponent>

      const replyHandler = new ReplyHandler()
        .addSelectionHandler(SELECT_PLAYER_MENU_CUSTOM_ID, handlePlayerSelected)
        .addClickHandler(CONFIRM_BUTTON_CUSTOM_ID, handleConfirm)

      const reply = await interaction.update({
        content: t(texts, locale, 'confirmation.content'),
        components: [
          playerSelectRow,
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(CONFIRM_BUTTON_CUSTOM_ID)
              .setLabel(t(commonTexts, locale, 'confirm'))
              .setStyle(ButtonStyle.Danger),
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

      async function handleConfirm(interaction: ButtonInteraction) {
        const playerData = service.getPlayerData(guild.id).playerData[playerId]
        playerClassService.delete(guild, { id: playerId })

        await interaction.update({
          content: t(texts, locale, 'playerRemoved.content').replace('{0}', playerData.name),
          components: [],
        })
      }
    }
  },
} satisfies ClientCommand
