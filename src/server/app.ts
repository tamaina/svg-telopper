import * as Koa from "koa"
import * as logger from "koa-logger"
import * as Pug from "koa-pug"
import * as locales from "../../locales"
import * as salt from "../../salt"
import { config } from "../config"
import { pkg } from "./pkg"
import router from "./router"

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
    salt: process.env.NODE_ENV !== "production" ? salt() : ""
  },
  viewPath: `${__dirname}/../../views`
})

app.use(logger())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)

export default app
