import {
  ApplicationIntegrationType,
  InteractionContextType,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'

import ClientCommand from '../models/ClientCommand.js'
import { commonTexts, t } from '../utils/translationUtils.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'help',
    [Locale.German]: 'hilfe',
  },
  description: {
    [Locale.EnglishGB]: 'Get some help about the bot commands',
    [Locale.German]: 'Zeige eine Liste der verfügbaren Befehle',
  },
  subText: {
    [Locale.EnglishGB]: 'Some of the commands listed may need additional permissions!',
    [Locale.German]: 'Einige dieser Befehle benötigen möglicherweise zusätzliche Berechtigungen!',
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
    const { commandId, locale } = interaction

    if (!interaction.inCachedGuild()) {
      // ToDo (Future): Figure out if cache can be filled instead
      await interaction.reply({
        content: t(commonTexts, locale, 'command.onlyUsableInGuild'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const { guild } = interaction

    // ToDo (Future): Figure out user permissions
    const message = [...guild.commands.cache]
      .filter(([key]) => key !== commandId)
      .map(([, command]) => {
        const name = command.nameLocalizations?.[locale] ?? command.name
        const description = command.descriptionLocalizations?.[locale] ?? command.description
        return `\`/${name}\`: ${description}`
      })
      .toSorted()
      .concat(`\n_${t(texts, locale, 'subText')}_`)
      .join('\n')

    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    })
  },
} satisfies ClientCommand
