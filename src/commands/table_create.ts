import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageFlags } from 'discord.js'

import { text } from '../i18n/text.js'
import ClientCommand from '../models/ClientCommand.js'
import languageService from '../service/languageService.js'
import service from '../service/raidTableService.js'

export default {
  data: new SlashCommandBuilder().setName('raid_table').setDescription('Erstelle eine Tabelle des Raidkaders'),
  async execute(interaction) {
    const guildId = interaction.guildId
    const locale = languageService.getGuildLanguage(guildId).locale

    const table = service.createTable(guildId, interaction.channelId)
    if (!table) {
      await interaction.reply({
        content: text(locale, 'tableExists'),
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    await interaction.reply({ embeds: [table] })
    const message = await interaction.fetchReply()
    service.addTableMessage(guildId, message)
  },
} satisfies ClientCommand
