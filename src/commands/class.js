import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageActionRow, MessageButton, MessageSelectMenu } from 'discord.js'
import service from '../service/playerClassService.js'

export default {
  data: new SlashCommandBuilder()
    .setName('klasse')
    .setDescription('Sag mir deine Klasse fürs Addon'),
  async execute(interaction) {
    const classSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('class-select')
        .setPlaceholder('Klasse')
        .addOptions(service.getClassSelectOptions())
    )
    await interaction.reply({
      content: 'Wähle deine Klasse:',
      components: [classSelectRow],
      ephemeral: true
    })
  },
  async executeSelect(interaction) {
    let classSelectRow = interaction.message.components[0]
    let specSelectRow = interaction.message.components[1]
    switch (interaction.customId) {
      case 'class-select':
        setDefaultOption(classSelectRow.components[0], interaction.values[0])
        specSelectRow = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('spec-select')
            .setPlaceholder('Spezialisierung')
            .addOptions(service.getSpecSelectOptions(interaction.values[0]))
        )
        await interaction.update({
          content: 'Wähle deine Spezialisierung:',
          components: [classSelectRow, specSelectRow]
        })
        return

      case 'spec-select':
        setDefaultOption(specSelectRow.components[0], interaction.values[0])
        const confirmButtonRow = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('confirm-button')
            .setLabel('Bestätigen')
            .setStyle('SUCCESS')
        )
        await interaction.update({
          content: 'Bestätige deine Spezialisierung:',
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
    const classSelectRow = interaction.message.components[0]
    const specSelectRow = interaction.message.components[1]
    const playerClassId = getDefaultOption(classSelectRow.components[0]).value
    const specializationId = getDefaultOption(specSelectRow.components[0]).value
    const { playerClass, specialization } = service.createOrUpdate(
      interaction.guildId,
      interaction.user,
      playerClassId,
      specializationId
    )
    await interaction.update({
      content: `Deine Auswahl: \n${playerClass.emoji} ${playerClass.description} - ${specialization.emoji} ${specialization.description}
            \nDu kannst deine Auswahl jederzeit ändern, benutze dazu wieder den Befehl '/klasse'!`,
      components: []
    })
  }
}

const getDefaultOption = component => component.options.find(_ => _.default)

const setDefaultOption = (component, defaultValue) =>
  component.options.forEach(_ => {
    _.default = _.value == defaultValue
  })
