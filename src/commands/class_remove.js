import service from '../service/playerClassService.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageActionRow, MessageButton } from 'discord.js'
import { text } from '../service/text.js'

export default {
  data: new SlashCommandBuilder()
    .setName('class_remove')
    .setDescription('Entferne deine Klasse'),
  async execute(interaction) {
    const guildId = interaction.guildId
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('confirm-button')
        .setLabel(text(guildId, 'yes'))
        .setStyle('DANGER')
    )
    await interaction.reply({
      content: text(guildId, 'sure'),
      components: [row],
      ephemeral: true
    })
  },
  async executeButton(interaction) {
    const guildId = interaction.guildId
    service.delete(guildId, interaction.user)
    await interaction.update({
      content: text(guildId, 'classRemoved'),
      components: []
    })
  }
}
