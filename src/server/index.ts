import * as log from "fancy-log"
import { readFileSync } from "fs"
import { createServer } from "http"
import * as Koa from "koa"
import * as logger from "koa-logger"
import * as Pug from "koa-pug"
import * as locales from "../../locales"
import * as salt from "../../salt"
import { config } from "../config"
import { obsSocket } from "./obsSocket"
import router from "./router"
import { socket } from "./socket"

const pkg = JSON.parse(readFileSync(`${__dirname}/../../package.json`, "utf8"))

const app = new Koa()

const langs = JSON.stringify(Object.keys(locales))

new Pug({
  app,
  basedir: process.cwd(),
  locals: {
    config,
    env: process.env.NODE_ENV,
    langs,
    pkg,
    require,
    salt: process.env.NODE_ENV === "development" ? salt() : ""
  },
  viewPath: `${__dirname}/views`
})

app.use(logger())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)

export default () => new Promise(resolve => {
  log(`SVG Type Writer v${pkg.version} Server Starting...`)

  const server = createServer(app.callback())
  const ws = socket(server)
  server.listen(config.port, resolve)
  obsSocket(ws)
})
