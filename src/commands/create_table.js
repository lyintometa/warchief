import { SlashCommandBuilder } from '@discordjs/builders'
import dataAccessService from '../dataAccessDiscord/dataAccessDiscordService.js'

export default {
  data: new SlashCommandBuilder()
    .setName('tabelle_erstellen')
    .setDescription('Erstelle eine Tabelle des Raidkaders'),
  async execute(interaction) {
    const settingsAccess = dataAccessService.getDataAccessSettings(interaction.guildId)
    const table = settingsAccess.createTable(
      interaction.member.guild.channels.cache.find(
        _ => _.id === interaction.channelId
      ),
      dataAccessService.getDataAccessPlayer(interaction.guildId).getPlayerData()
    )
    if (!table) {
      await interaction.reply({ content: 'Es gibt bereits einen Table', ephemeral: true })
      return
    }
    await interaction.reply({ embeds: [table] })
    const message = await interaction.fetchReply()
    settingsAccess.addTableMessage(message)
  }
}
