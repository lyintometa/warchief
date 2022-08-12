import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageActionRow, MessageButton } from 'discord.js'
import service from '../service/playerClassService.js'

export default {
  data: new SlashCommandBuilder()
    .setName('klasse_entfernen')
    .setDescription('Entferne deine Klasse'),
  async execute(interaction) {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('confirm-button')
        .setLabel('Ja')
        .setStyle('DANGER')
    )
    await interaction.reply({
      content: 'Bist du sicher?',
      components: [row],
      ephemeral: true
    })
  },
  async executeButton(interaction) {
    service.delete(interaction.guildId, interaction.user)
    await interaction.update({
      content:
        'Deine Klasse wurde entfernt! \nDu kannst eine neue Klassen über "/klasse" hinzufügen',
      components: []
    })
  }
}
