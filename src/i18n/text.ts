import { translations } from '../dataAccess/dataAccess.js'

export const supportedLocales = Object.keys(translations)

export const text = (locale: string, textKey: string) => {
  if (!supportedLocales.includes(locale)) locale = 'en_GB'
  return translations[locale][textKey] ?? `#${textKey}`
}
