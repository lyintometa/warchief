import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageFlags } from 'discord.js'

import { commands } from '../dataAccess/dataAccess.js'
import ClientCommand from '../models/ClientCommand.js'
import service from '../service/languageService.js'

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Change the language of the bot'),
  async execute(interaction) {
    const locale = service.getGuildLanguage(interaction.guildId).locale

    const message = Object.keys(commands[locale])
      .filter(key => key !== 'help')
      .map(command => '`/' + commands[locale][command].name + '`: ' + commands[locale][command].description)
      .join('\n')

    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    })
  },
} satisfies ClientCommand
