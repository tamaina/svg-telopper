import $ from "cafy"
import equal from "deep-equal"
import { IPresetQuery, IQuery, IRenderInstanceQuery, ISTWOptions } from "../../models/queries"
import { ISocketData } from "../../models/socketData"
import { Socket } from "./socket"

export class STW {
  public options: ISTWOptions
  public initialized: boolean = false
  public showing: number
  public renderInstanceId: string
  private client: HTMLElement
  private subtitles: HTMLElement[] = []
  private root: ShadowRoot
  private socket: Socket
  private presets: IPresetQuery[]
  private updating: boolean

  // コンストラクタは、socketの送受信を設定します。
  constructor(root: HTMLElement = document.body, renderInstanceId: string, socket: Socket) {
    this.renderInstanceId = renderInstanceId
    this.socket = socket

    socket.socket.addEventListener("message", ev => {
      if (!$.str.ok(ev.data)) return
      const data = JSON.parse(ev.data) as ISocketData
      if (
        // data.bodyがない もしくは
        !data.body ||
        /*
          "「body.renderInstanceIdが存在しない」または
          「idが存在し、自分のrenderInstanceIdとマッチする」" にあてはまらない
                  つまり
          「body.renderInstanceIdが存在する」かつ「idが存在し、自分のrenderInstanceIdとマッチしない」
        */
        !$.optional.nullable.str.match(new RegExp(renderInstanceId)).ok(data.body.renderInstanceId)
        ) return
      switch (data.body.type) {
      case "initializeRenderInstance":
        this.init(data.body, root)
        break
      case "updateRenderInstance":
        this.updateRInfo(data.body)
        break
      case "showRenderInstanceSubtitle":
        this.show(data.body.target)
        break
      case "queryUpdated":
        this.updateQuery(data.body.query)
        break
      }
    })
  }

  // initです。「initializeRenderInstance」を受け取ることで起動します。
  public async init(data, root: HTMLElement) {
    if (this.initialized) return
    this.initialized = true
    this.presets = await this.socket.request({
      type: "queries/list",
      isPreset: true
    }).then(res => res.presets)
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

  public async updateRInfo(data) {
    if (this.updating) return
    this.updating = true
    const nextOption = data.options
    if (equal(this.options, nextOption, { strict: true })) return

    const elementsPool = Object.assign({}, this.subtitles)
    for (let i = 0; i < nextOption.query; i += 1) {
      const query = nextOption.query[i]
      const oldElem = this.client.children.item(i) as HTMLElement
      if (oldElem && oldElem.dataset.id === query) continue

      const foundElem = elementsPool.find(e => e.dataset.id === query)

      if (foundElem) { oldElem
        ? this.client.insertBefore(foundElem, oldElem)
        : this.client.insertAdjacentElement("beforeend", foundElem)
      } else {
        await this.socket.request({
          type: "queries/list",
          ids: [query]
        }).then(async queryList => {
          this.insertSubtitle(queryList[0], i)
        })
      }
      elementsPool.push(this.client.removeChild(oldElem))
    }
    if (nextOption.length > this.client.childElementCount) {
      for (let i = nextOption.length; i < this.client.childElementCount; i += 1) {
        this.client.removeChild(this.client.children.item(i))
      }
    }

    this.options = data.options
    this.updating = false
  }

  public async updateQuery(query: IQuery) {
    if (this.updating) return
    this.updating = true
    this.presets = this.presets.map(e => e._id === query._id ? query as IPresetQuery : e)
    const updateTargets = this.subtitles.map(
      e => (e.dataset.id === query._id || e.dataset.presetId === query._id) ? e : null
    )
    for (let i = 0; i < updateTargets.length; i += 0) {
      if (!updateTargets[i]) continue
      this.insertSubtitle(query as IRenderInstanceQuery, i)
      this.client.removeChild(updateTargets[i])
    }
    this.updating = false
  }

  public insertSubtitles(queries: string[]) {
    this.socket.request({
      type: "queries/list",
      ids: queries
    }).then(async queryList => {
      for (const query of queryList.queries as IRenderInstanceQuery[]) {
        this.insertSubtitle(query)
      }
    })
  }

  public insertSubtitle(query: IRenderInstanceQuery, insertBefore?: number) {
    const preset = this.presets.find(e => e._id === query.presetId)
    const replacers = []
    for (const replacer of query.replace || preset.replace) {
      replacers.push(new RegExp(replacer, "g"))
    }
    let rhtml = query.innerHtml || preset.innerHtml

    for (let i = 0; i < replacers.length; i += 1) {
      rhtml = rhtml.replace(replacers[i], query.text[i] || "")
    }

    const el = document.createElement("div")
    el.classList.add("wrapper")
    el.innerHTML = rhtml
    el.attachShadow({mode: "open"})
    el.dataset.id = query._id
    el.dataset.presetId = query.presetId
    el.dataset.timeout = query.timeout ? `${query.timeout}` : null

    const ibTest = $.num.min(0).max(this.client.childElementCount - 1).ok(insertBefore)
    const subtitle = (() => {
      if (ibTest) {
        return this.client.insertBefore(el, this.client.children.item(insertBefore))
      } else {
        return this.client.insertAdjacentElement("beforeend", el)
      }
    })() as HTMLElement

    if (ibTest) {
      this.subtitles.splice(insertBefore, 0, subtitle)
    } else {
      this.subtitles.push(subtitle)
    }
    switch (query.anchor || preset.anchor) {
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
    if (query.function || preset.function) {
      const func = new Function("subtitle", "query", "preset", query.function || preset.function)
      func.bind(this, subtitle)
    }
  }

  public show(target: number) {
    if (this.subtitles.length <= 1) return
    this.showing = target % this.subtitles.length
    for (let i = 0; i < this.subtitles.length; i += 1) {
      const subtitle = this.subtitles[i]
      if (i === this.showing) {
        subtitle.classList.add("show")
        for (const item of Array.from(subtitle.children)) item.classList.add("show")
        subtitle.style.zIndex = String(1 * (this.options.reverse ? -1 : 1))
        if (subtitle.dataset.timeout) setTimeout(this.show.bind(this, i + 1), Number(subtitle.dataset.timeout))
      } else {
        subtitle.classList.remove("show")
        for (const item of Array.from(subtitle.children)) item.classList.remove("show")
        subtitle.style.zIndex = String(1 * (this.options.reverse ? 1 : -1))
      }
    }
  }
}
