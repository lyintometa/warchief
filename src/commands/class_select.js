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
      content: text(guildId, 'chooseClass'),
      components: [classSelectRow],
      ephemeral: true
    })
  },
  async executeSelect(interaction) {
    const guildId = interaction.guildId
    const classSelectRow = interaction.message.components[0]
    let specOrRoleSelectRow = interaction.message.components[1]
    let messageText
    switch (interaction.customId) {
      case 'class-select':
        setDefaultOption(classSelectRow.components[0], interaction.values[0])

        messageText =
          interaction.values[0] === '13'
            ? text(guildId, 'chooseRole')
            : text(guildId, 'chooseSpec')

        const placeholder =
          interaction.values[0] === '13'
            ? text(guildId, 'role')
            : text(guildId, 'spec')

        const options =
          interaction.values[0] === '13'
            ? service.getRoleSelectOptions(guildId)
            : service.getSpecSelectOptions(guildId, interaction.values[0])

        specOrRoleSelectRow = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('spec-role-select')
            .setPlaceholder(placeholder)
            .addOptions(options)
        )

        await interaction.update({
          content: messageText,
          components: [classSelectRow, specOrRoleSelectRow]
        })
        return

      case 'spec-role-select':
        messageText =
          getDefaultOption(classSelectRow.components[0]).value === '13'
            ? text(guildId, 'confirmRole')
            : text(guildId, 'confirmSpec')

        setDefaultOption(
          specOrRoleSelectRow.components[0],
          interaction.values[0]
        )
        const confirmSpecButtonRow = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('confirm-button')
            .setLabel(text(guildId, 'confirm'))
            .setStyle('SUCCESS')
        )
        await interaction.update({
          content: messageText,
          components: [
            classSelectRow,
            specOrRoleSelectRow,
            confirmSpecButtonRow
          ]
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
    const specOrRoleSelectRow = interaction.message.components[1]
    const playerClassId = getDefaultOption(classSelectRow.components[0]).value
    const specOrRoleId = getDefaultOption(
      specOrRoleSelectRow.components[0]
    ).value

    if (playerClassId === '13') {
      let { roleDesc, roleEmoji } = service.createOrUpdateRole(
        guildId,
        interaction.user,
        specOrRoleId
      )
      await interaction.update({
        content: `${text(guildId, 'yourSelect')}:
        \n${roleEmoji} ${roleDesc}
              \n${text(guildId, 'canChange')}`,
        components: []
      })
      return
    }

    let { playerClassDesc, playerClassEmoji, specDesc, specEmoji } =
      service.createOrUpdate(
        guildId,
        interaction.user,
        playerClassId,
        specOrRoleId
      )
    await interaction.update({
      content: `${text(guildId, 'yourSelect')}:
      \n${playerClassEmoji} ${playerClassDesc} - ${specEmoji} ${specDesc}
            \n${text(guildId, 'canChange')}`,
      components: []
    })
  }
}
