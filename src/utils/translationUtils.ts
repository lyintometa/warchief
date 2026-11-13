import { Locale } from 'discord.js'

export const t = <TKey extends string>(
  translations: Record<TKey, Record<Locale.EnglishGB, string> & Partial<Record<Locale, string>>>,
  locale: Locale,
  textKey: TKey,
): string => translations[textKey][locale] || translations[textKey][Locale.EnglishGB]

export const commonTexts = {
  'confirm': {
    [Locale.EnglishGB]: 'Confirm',
    [Locale.German]: 'Bestätigen',
  },
  'yes': {
    [Locale.EnglishGB]: 'Yes',
    [Locale.German]: 'Ja',
  },
  'selection.timeout': {
    [Locale.EnglishGB]: 'No selection made within 1 minute, cancelling...',
    [Locale.German]: 'Es wurde innerhalb von 1 Minute kein Auswahl getroffen, Abbruch...',
  },
  'confirmation.timeout': {
    [Locale.EnglishGB]: 'No confirmation received within 1 minute, cancelling...',
    [Locale.German]: 'Keine Bestätigung innerhalb von 1 Minute erhalten, Abbruch...',
  },
  'command.onlyUsableInGuild': {
    [Locale.EnglishGB]: 'This command can only be used on a server.',
    [Locale.German]: 'Dieser Command kann nur innerhalb eines Servers verwendet werden',
  },
  'command.name.plural': {
    [Locale.EnglishGB]: 'Commands',
    [Locale.German]: 'Befehle',
  },
}
