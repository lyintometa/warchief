import service from '../service/playerClassService.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageActionRow, MessageButton, MessageSelectMenu } from 'discord.js'
import { getDefaultOption, setDefaultOption } from './util/util.js'
import { text } from '../service/text.js'

export default {
  data: new SlashCommandBuilder()
    .setName('class_select')
    .setDescription('Sag mir deine Klasse fürs Addon'),
  async execute(interaction) {
    const guildId = interaction.guildId
    const classSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('class-select')
        .setPlaceholder(text(guildId, 'class'))
        .addOptions(service.getClassSelectOptions(guildId))
    )
    await interaction.reply({
      content: text(guildId, 'classSelect'),
      components: [classSelectRow],
      ephemeral: true
    })
  },
  async executeSelect(interaction) {
    const guildId = interaction.guildId
    const classSelectRow = interaction.message.components[0]
    let specSelectRow = interaction.message.components[1]
    switch (interaction.customId) {
      case 'class-select':
        setDefaultOption(classSelectRow.components[0], interaction.values[0])
        specSelectRow = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('spec-select')
            .setPlaceholder(text(guildId, 'spec'))
            .addOptions(
              service.getSpecSelectOptions(guildId, interaction.values[0])
            )
        )
        await interaction.update({
          content: text(guildId, 'specSelect'),
          components: [classSelectRow, specSelectRow]
        })
        return

      case 'spec-select':
        setDefaultOption(specSelectRow.components[0], interaction.values[0])
        const confirmButtonRow = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('confirm-button')
            .setLabel(text(guildId, 'confirm'))
            .setStyle('SUCCESS')
        )
        await interaction.update({
          content: text(guildId, 'confirmSpec'),
          components: [classSelectRow, specSelectRow, confirmButtonRow]
        })
        return

      default:
        throw new Error(
          'Custom ID of interaction not recognized for slash command "/klasse"'
        )
    }
  },
  async executeButton(interaction) {
    const guildId = interaction.guildId
    const classSelectRow = interaction.message.components[0]
    const specSelectRow = interaction.message.components[1]
    const playerClassId = getDefaultOption(classSelectRow.components[0]).value
    const specializationId = getDefaultOption(specSelectRow.components[0]).value
    const { playerClassDesc, playerClassEmoji, specDesc, specEmoji } =
      service.createOrUpdate(
        guildId,
        interaction.user,
        playerClassId,
        specializationId
      )
    await interaction.update({
      content: `${text(guildId, 'yourSelect')}:
      \n${playerClassEmoji} ${playerClassDesc} - ${specEmoji} ${specDesc}
            \n${text(guildId, 'canChange')}`,
      components: []
    })
  }
}
