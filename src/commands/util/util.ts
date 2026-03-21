import { StringSelectMenuComponent } from 'discord.js'

export const setDefaultOption = (component: StringSelectMenuComponent, defaultValue: string) =>
  component.options.forEach(option => {
    option.default = option.value == defaultValue
  })
