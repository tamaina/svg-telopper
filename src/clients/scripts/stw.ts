import $ from "cafy"
import ReconnectingWebSocket from "reconnecting-websocket"
import { IQueries, IQuery } from "../../models/queries"
import { ISocketData } from "../../models/socketData"

export interface ISTWOptions {
  queries: IQueries
  reverse?: boolean
  stretch?: boolean
}

export class STW {
  public options: ISTWOptions
  public initialized: boolean = false
  public showing: number
  public renderInstanceId: string
  private client: HTMLElement
  private subtitles: HTMLElement[] = []
  private root: ShadowRoot

  // コンストラクタは、socketの送受信を設定します。
  constructor(root: HTMLElement = document.body, renderInstanceId: string, socket: ReconnectingWebSocket) {
    this.renderInstanceId = renderInstanceId

    socket.addEventListener("message", ev => {
      if (!$.str.ok(ev.data)) return
      const data = JSON.parse(ev.data) as ISocketData
      if (data.body && data.body.renderInstanceId && data.body.renderInstanceId !== renderInstanceId) return
      switch (data.body.type) {
        case "initializeRenderInstance":
          this.init(data.body, root)
          break
        case "appendRenderInstanceSubtitles":
          this.insertSubtitles((data.body).queries)
          break
        case "removeRenderInstanceSubtitles":
          this.removeSubtitles((data.body).targets)
          break
        case "showRenderInstanceSubtitle":
          this.show((data.body).target)
      }
    })
  }

  // initです。「initializeRenderInstance」を受け取ることで起動します。
  public init(data, root: HTMLElement) {
    if (this.initialized) return
    this.initialized = true
    this.options = data.options
    try {
      this.root = root.attachShadow({mode: "open"})
    } catch (e) {
      throw new Error("不適切な要素が指定されました。")
    }
    this.client = this.root.getElementById("client")
    if (data.queries && data.queries.length > 0) {
      this.insertSubtitles(data.queries)
      this.show(0)
    }
  }

  public insertSubtitles(queries: IQueries) {
    for (const query of queries) {
      this.insertSubtitle(query)
    }
  }

  public insertSubtitle(query: IQuery) {
    const replacers = []
    for (const replacer of query.replace) {
      replacers.push(new RegExp(replacer, "g"))
    }
    let rhtml = query.innerHtml

    for (let i = 0; i < replacers.length; i += 1) {
      rhtml = rhtml.replace(replacers[i], query.text[i])
    }

    const el = document.createElement("div")
    el.classList.add("wrapper")
    el.innerHTML = rhtml
    el.attachShadow({mode: "open"})

    const subtitle = (() => {
      if (query.insertBefore) {
        return this.client.insertBefore(el, this.client.children.item(query.insertBefore))
      } else {
        return this.client.insertAdjacentElement("beforeend", el)
      }
    })() as HTMLElement

    if (query.insertBefore) {
      this.subtitles.splice(query.insertBefore, 0, subtitle)
    } else {
      this.subtitles.push(subtitle)
    }
    switch (query.anchor) {
      case "start":
        subtitle.style.transformOrigin = "left"
        break
      case "end":
        subtitle.style.transformOrigin = "right"
        break
      case "middle":
        subtitle.style.transformOrigin = "center"
        break
      }
/*
    const clientBcr = this.client.getBoundingClientRect()

    subtitle.children.item(0).classList.add("show")

    const scaleXs = [] as number[]
    const scaleYs = [] as number[]

    for (const e of Array.from(subtitle.children)) {
      for (const element of Array.from(e.children)) {
        const subtitleBcr = element.getBoundingClientRect()

        let wratio = clientBcr.width / subtitleBcr.width
        if (wratio < 1) {
          let subtitleBcr2 = subtitleBcr
          while (subtitleBcr2.width > clientBcr.width) {
            subtitleBcr2 = element.getBoundingClientRect()
            wratio -= 0.0025
            subtitle.style.transform = `scaleX(${wratio})`
          }
          scaleXs.push(wratio)
        } else if (this.options.stretch) {
          scaleXs.push(wratio)
        }

        const hratio = clientBcr.height / subtitleBcr.height
        if (hratio < 1) {
          // 何もしない
        } else if (this.options.stretch) {
          scaleYs.push(hratio)
        }
      }
    }
    const scaleX = scaleXs.length > 0 ? Math.max(...scaleXs) : 1
    const scaleY = scaleYs.length > 0 ? Math.max(...scaleYs) : 1
    subtitle.style.transform =
      `scale(${scaleX}, ${scaleY})`
*/
    if (query.function) {
      const func = new Function("subtitle", query.function)
      func.bind(this, subtitle)
    }
  }

  public removeSubtitles(targets: number[]) {
    const removed = [] as HTMLElement[]
    for (const target of targets) {
      const element = this.subtitles[target]
      removed.push(element)
      this.subtitles.splice(target, 1)
      this.client.removeChild(element)
    }
    return removed
  }

  public show(target: number) {
    if ($.num.max(this.subtitles.length - 1).min(-1)) throw new Error("ターゲットの数値が不正か、このインスタンスには何もありません。")
    this.showing = target
    for (let i = 0; i < this.subtitles.length; i += 1) {
      const subtitle = this.subtitles[i]
      if (i === target) {
        for (const item of Array.from(subtitle.children)) item.classList.add("show")
        subtitle.style.zIndex = String(1 * (this.options.reverse ? -1 : 1))
      } else {
        for (const item of Array.from(subtitle.children)) item.classList.remove("show")
        subtitle.style.zIndex = String(1 * (this.options.reverse ? 1 : -1))
      }
    }
  }
}
