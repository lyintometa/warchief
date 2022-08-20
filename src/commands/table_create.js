import service from '../service/raidTableService.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { text } from '../service/text.js'

export default {
  data: new SlashCommandBuilder()
    .setName('raid_table')
    .setDescription('Erstelle eine Tabelle des Raidkaders'),
  async execute(interaction) {
    const guildId = interaction.guildId
    const table = service.createTable(guildId, interaction.channelId)
    if (!table) {
      await interaction.reply({
        content: text(guildId, 'tableExists'),
        ephemeral: true
      })
      return
    }
    await interaction.reply({ embeds: [table] })
    const message = await interaction.fetchReply()
    service.addTableMessage(guildId, message)
  }
}
