import * as fs from "fs"
import * as yaml from "js-yaml"

export interface ISource {
  url: string
  db: string
  port: number
  obs: {
    address: string
    password?: string
  }
}

export interface IMixin {
  parsedUrl: URL
}

const yml = fs.readFileSync(`${__dirname}/../.config.yaml`, "utf8")

const conf = yaml.safeLoad(yml) as ISource
conf.url = normalizeUrl(conf.url)
const parsedUrl = validateUrl(conf.url)

export const config = Object.assign(({
  parsedUrl
} as IMixin), conf)

function tryCreateUrl(url: string) {
  try {
    return new URL(url)
  } catch (e) {
    throw new Error(`url="${url}" is not a valid URL.`)
  }
}

function validateUrl(url: string) {
  const result = tryCreateUrl(url)
  if (result.pathname.replace("/", "").length) throw new Error(`url="${url}" is not a valid URL, has a pathname.`)
  if (!url.includes(result.host)) throw new Error(`url="${url}" is not a valid URL, has an invalid hostname.`)
  return result
}

function normalizeUrl(url: string) {
  return url.endsWith("/") ? url.substr(0, url.length - 1) : url
}
