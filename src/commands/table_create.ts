import {
  ApplicationIntegrationType,
  InteractionContextType,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'

import ClientCommand from '../models/ClientCommand.js'
import service from '../service/raidTableService.js'
import { commonTexts, t } from '../utils/translationUtils.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'create_table',
    [Locale.German]: 'tabelle_erstellen',
  },
  description: {
    [Locale.EnglishGB]: 'Create a table showing all raid members',
    [Locale.German]: 'Erstelle eine Tabelle des Raidkaders',
  },
  'exists.content': {
    [Locale.EnglishGB]: 'This channel already has a table',
    [Locale.German]: 'Es gibt bereits eine Tabelle in diesem Kanal',
  },
}

export default {
  data: new SlashCommandBuilder()
    .setName(texts.name[Locale.EnglishGB])
    .setNameLocalizations(texts.name)
    .setDescription(texts.description[Locale.EnglishGB])
    .setDescriptionLocalizations(texts.description)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall),

  async execute(interaction) {
    const { channelId, locale } = interaction

    if (!interaction.inCachedGuild()) {
      // ToDo (Future): Figure out if cache can be filled instead
      await interaction.reply({
        content: t(commonTexts, locale, 'command.onlyUsableInGuild'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const { guild } = interaction

    const tableEmbed = await service.createTable(guild, channelId)

    if (tableEmbed === undefined) {
      await interaction.reply({
        content: t(texts, locale, 'exists.content'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const response = await interaction.reply({ embeds: [tableEmbed], withResponse: true })
    service.addTableMessage(guild.id, response.resource!.message!)
  },
} satisfies ClientCommand
