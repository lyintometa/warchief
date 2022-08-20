import service from '../service/languageService.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { commands } from '../dataAccess/dataAccess.js'

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Change the language of the bot'),
  async execute(interaction) {
    const locale = service.getLanguageLocale(interaction.guildId)
    const content = Object.keys(commands[locale])
      .filter(key => key !== 'help')
      .map(
        command =>
          '`/' +
          commands[locale][command].name +
          '`: ' +
          commands[locale][command].description
      )
      .join('\n')
    await interaction.reply({
      content,
      ephemeral: true
    })
  }
}
