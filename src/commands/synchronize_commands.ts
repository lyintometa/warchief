import {
  ApplicationCommand,
  ApplicationCommandType,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
  Snowflake,
} from 'discord.js'

import ClientCommand from '../models/ClientCommand.js'
import ObjectUtils from '../utils/ObjectUtils.js'
import { commonTexts, t } from '../utils/translationUtils.js'
import { clientCommands } from './util/commandLoader.js'

const texts = {
  name: {
    [Locale.EnglishGB]: 'synchronize_commands',
    [Locale.German]: 'commands_synchronisieren',
  },
  description: {
    [Locale.EnglishGB]: 'Synchronize the bot commands in this server',
    [Locale.German]: 'Synchronisiere die Bot Commands auf diesem Server',
  },
  'success.content': {
    [Locale.EnglishGB]: 'The commands where successfully synchronized',
    [Locale.German]: 'Die Commands wurden erfolgreich synchronisiert',
  },
  'success.content.none': {
    [Locale.EnglishGB]: 'All commands are up-to-date',
    [Locale.German]: 'Alle Commands sind aktuell',
  },
  'success.content.new': {
    [Locale.EnglishGB]: 'New',
    [Locale.German]: 'Neu',
  },
  'success.content.updated': {
    [Locale.EnglishGB]: 'Updated',
    [Locale.German]: 'Aktualisiert',
  },
  'success.content.removed': {
    [Locale.EnglishGB]: 'Removed',
    [Locale.German]: 'Entfernt',
  },
}

export default {
  data: new SlashCommandBuilder()
    .setName(texts.name[Locale.EnglishGB])
    .setNameLocalizations(texts.name)
    .setDescription(texts.description[Locale.EnglishGB])
    .setDescriptionLocalizations(texts.description),
  execute: async interaction => {
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

    const commandDefinitions = await clientCommands()
    const guildCommands = await guild.commands.fetch({ force: true, withLocalizations: true })

    const createdCommands: ApplicationCommand[] = []
    const updatedCommands: ApplicationCommand[] = []
    const deletedCommands: ApplicationCommand[] = []
    const createdOrUpdatedCommandIds: Snowflake[] = []

    for (const { data: commandDefinition } of commandDefinitions.values()) {
      if (!(commandDefinition instanceof SlashCommandBuilder)) {
        continue
      }

      let guildCommand = guildCommands.find(command => command.name === commandDefinition.name)
      if (guildCommand !== undefined) {
        if (
          !ObjectUtils.deepEquals(guildCommand.nameLocalizations, commandDefinition.name_localizations)
          || guildCommand.description !== commandDefinition.description
          || !ObjectUtils.deepEquals(guildCommand.descriptionLocalizations, commandDefinition.description_localizations)
          || guildCommand.type !== ApplicationCommandType.ChatInput
        ) {
          guildCommand = await guild.commands.edit(guildCommand, commandDefinition.toJSON())
          updatedCommands.push(guildCommand)
        }
      } else {
        guildCommand = await guild.commands.create(commandDefinition.toJSON())
        createdCommands.push(guildCommand)
      }

      createdOrUpdatedCommandIds.push(guildCommand.id)
    }

    for (const guildCommand of guildCommands.values()) {
      if (createdOrUpdatedCommandIds.includes(guildCommand.id)) {
        continue
      }

      await guild.commands.delete(guildCommand)
      deletedCommands.push(guildCommand)
    }

    if (createdCommands.length + updatedCommands.length + deletedCommands.length === 0) {
      await interaction.reply({
        content: t(texts, locale, 'success.content.none'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    let message = `${t(texts, locale, 'success.content')}\n\n`

    if (createdCommands.length > 0) {
      message +=
        `${t(texts, locale, 'success.content.new')}\n`
        + `${createdCommands.map(command => `- ${command.nameLocalizations?.[locale] ?? command.name}`).join('\n')}\n`
    }

    if (updatedCommands.length > 0) {
      message +=
        `${t(texts, locale, 'success.content.updated')}\n`
        + `${updatedCommands.map(command => `- ${command.nameLocalizations?.[locale] ?? command.name}`).join('\n')}\n`
    }

    if (deletedCommands.length > 0) {
      message +=
        `${t(texts, locale, 'success.content.removed')}\n`
        + `${deletedCommands.map(command => `- ${command.nameLocalizations?.[locale] ?? command.name}`).join('\n')}\n`
    }

    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    })
  },
} satisfies ClientCommand
