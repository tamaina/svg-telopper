import * as Router from "koa-router"
import * as send from "koa-send"

const router = new Router()

router.get(["/render", "/setting"], async (ctx, next) => {
  ctx.render(ctx.request.url.slice(1))
})

router.get("/assets*", async (ctx, next) => {
  await send(ctx as any, ctx.path.slice(7), {
    root: `${__dirname}/../assets/`
  })
})

router.get("*", async (ctx, next) => {
  ctx.type = "text/plain; charset=utf-8"
  await send(ctx as any, "help.md", {
    root: `${__dirname}/views/`
  })
})

export default router
