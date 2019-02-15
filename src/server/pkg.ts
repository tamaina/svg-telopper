import { readFileSync } from "fs"

export const pkg = JSON.parse(readFileSync(`${__dirname}/../../package.json`, "utf8"))
