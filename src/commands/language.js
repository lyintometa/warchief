import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageActionRow, MessageButton, MessageSelectMenu } from 'discord.js'
import { getDefaultOption, setDefaultOption } from './util/util.js'
import service from '../service/languageService.js'

export default {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Change the language of the bot'),
  async execute(interaction) {
    const languageSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('language-select')
        .setPlaceholder('Language')
        .addOptions(service.getLanguageSelectOptions(interaction.guildId))
    )
    await interaction.reply({
      content: 'Choose the language:',
      components: [languageSelectRow],
      ephemeral: true
    })
  },
  async executeSelect(interaction) {
    if (interaction.customId !== 'language-select')
      throw new Error('Custom ID of interaction not recognized for slash command "/klasse"')
    const languageSelectRow = interaction.message.components[0]
    setDefaultOption(languageSelectRow.components[0], interaction.values[0])
    const confirmButtonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('confirm-button')
        .setLabel('Confirm')
        .setStyle('SUCCESS')
    )
    await interaction.update({
      content: 'Confirm your choice:',
      components: [languageSelectRow, confirmButtonRow]
    })
  },
  async executeButton(interaction) {
    const language = service.update(
      interaction.guildId,
      getDefaultOption(interaction.message.components[0].components[0]).value
    )
    await interaction.update({
      content: `The warchief's new language: \n${language.emoji} ${language.description}`,
      components: []
    })
  }
}
