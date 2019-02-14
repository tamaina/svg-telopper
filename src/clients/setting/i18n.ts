import { lang, locale } from "./info"

export const I18n = (scope?: string) => {
  const texts = scope ? locale[scope] || {} : {}
  texts["@"] = locale.common
  return {
    locale: lang,
    messages: {
      [lang]: texts
    },
    sync: false
  }
}
