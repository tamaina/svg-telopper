/**
 * Languages Loader
 * (a copy of https://github.com/syuilo/misskey/blob/develop/locales/index.js)
 */

const fs = require("fs")
const yaml = require("js-yaml")

const langs = ["ja-JP"]

const loadLocale = lang => yaml.safeLoad(fs.readFileSync(`${__dirname}/${lang}.yaml`, "utf-8"))
const locales = langs.map(lang => ({ [lang]: loadLocale(lang) }))

module.exports = locales.reduce((a, b) => ({ ...a, ...b }))
