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
  private root: HTMLElement
  private socket: Socket
  private presets: IPresetQuery[] = []
  private updating: boolean
  private setTimeout: number = null

  // コンストラクタは、socketの送受信を設定します。
  constructor(root: HTMLElement = document.body, renderInstanceId: string, socket: Socket) {
    console.log("called: constructor")
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
        case "renderInstanceUpdated":
          this.updateRInfo(data.body)
          break
        case "showRenderInstanceSubtitle":
          this.show(Number(data.body.target))
          break
        case "queryUpdated":
          this.updateQuery(data.body.query)
          break
      }
    })
  }

  // initです。「initializeRenderInstance」を受け取ることで起動します。
  public async init(data, root: HTMLElement) {
    console.log("called: init", data, root)
    if (this.initialized) return
    this.initialized = true
    this.presets = await this.socket.operate("query/list", {
      isPreset: true
    }).then(res => res.queries)
    this.options = data.options
    try {
      this.root = root
      this.root.style.display = "flex"
      this.root.style.alignItems = "center"
      this.root.style.justifyContent = "center"
      this.root.style.margin = "0"
    } catch (e) {
      throw new Error("不適切な要素が指定されました。")
    }
    this.client = this.root.getElementsByClassName("client").item(0) as HTMLElement
    this.client.style.width = data.options.clientWidth || "80%"
    this.client.style.height = data.options.clientHeght || "80%"
    if (data.options.queries && data.options.queries.length > 0) {
      this.insertSubtitles(data.options.queries)
        .then(() => {
          const showingIndex = Number(data.options.showingIndex) || 0
          this.show(showingIndex)
        })
    }
  }

  public renewAllSubtitles(queries: string[]) {
    console.log("called: renewAllSubtitles")
    this.client.innerHTML = ""
    this.subtitles = []
    this.insertSubtitles(queries)
    .then(() => {
      const showingIndex = Number(this.showing) || 0
      this.show(showingIndex)
    })
  }

  public async updateRInfo(data) {
    console.log("called: updateRInfo", data)
    if (this.updating) return
    this.updating = true
    const nextOption = data.query.options
    if (equal(this.options, nextOption, { strict: true })) return

    let renewAllSubtitles = false
    if (nextOption.clientWidth !== this.options.clientWidth) {
      renewAllSubtitles = true
      this.client.style.width = nextOption.clientWidth
    }
    if (nextOption.clientHeight !== this.options.clientHeight) {
      renewAllSubtitles = true
      this.client.style.height = nextOption.clientHeight
    }
    this.showing = nextOption.showingIndex

    let passed = 0
    if (renewAllSubtitles) this.renewAllSubtitles(nextOption.queries)
    else {
      const elementsPool = [].concat(this.subtitles) as HTMLElement[]
      for (let i = 0; i < nextOption.queries.length; i += 1) {
        const query = nextOption.queries[i]
        const oldElem = this.client.children.item(i - passed) as HTMLElement
        if (oldElem ? oldElem.dataset.id === query : false) continue

        const foundElem = elementsPool.find(e => e.dataset.id === query)

        let res
        if (foundElem) {
          if (oldElem) {
            this.client.insertBefore(foundElem, oldElem)
            this.client.removeChild(oldElem)
          } else {
            this.client.insertAdjacentElement("beforeend", foundElem)
          }
        } else {
          res = await this.socket.operate("query/list", {
            ids: [query]
          }).then(queryList => {
            if (!queryList.queries || !queryList.queries[0]) {
              passed += 1
              return true
            }
            return this.insertSubtitle(queryList.queries[0], i - passed)
          })
          if (oldElem && !res) {
            this.client.removeChild(oldElem)
          }
        }
      }
      if ((this.client.children.length || 0) > nextOption.queries.length - passed) {
        for (let i = nextOption.queries.length - passed; i < this.client.children.length; i += 1) {
          this.client.removeChild(this.client.children.item(i))
        }
      }
      this.subtitles = Array.from(this.client.children) as HTMLElement[]
    }

    this.show(this.showing)

    this.options = nextOption
    this.updating = false
  }

  public updateQuery(query: IQuery) {
    console.log("called: updateQuery", query)
    if (this.updating) return
    this.updating = true
    this.presets = this.presets.map(e => e._id === query._id ? query as IPresetQuery : e)
    const updateTargets = this.subtitles.map(e => {
        if (e.dataset.id === query._id) return { q: 0, e }
        if (e.dataset.presetId === query._id) return { q: 1, e, id: e.dataset.id }
        return null
      })
    console.log(updateTargets)
    for (let i = 0; i < updateTargets.length; i += 1) {
      const target = updateTargets[i]
      if (!target) continue
      if (target.q === 0) {
        this.insertSubtitle(query as IRenderInstanceQuery, i)
        this.client.removeChild(target.e)
        this.subtitles.splice(i + 1, 1)
        continue
      }
      if (target.q === 1) {
        this.presets = this.presets.map(e => {
          if (e._id !== query._id) return e
          return query as IPresetQuery
        })
        this.socket.operate("query/list", {
          ids: [target.id]
        }).then(queryList => {
          if (!queryList.queries || !queryList.queries[0]) return
          this.insertSubtitle(queryList.queries[0], i)
        })
      }
    }

    this.show(this.showing)
    this.updating = false
  }

  public insertSubtitles(queries: string[]) {
    console.log("called: insertSubtitles", queries)
    return this.socket.operate("query/list", {
      ids: queries
    }).then(async queryList => {
      for (const query of queryList.queries.filter(e => e) as IRenderInstanceQuery[]) {
        this.insertSubtitle(query)
      }
    })
  }

  public insertSubtitle(query: IRenderInstanceQuery, insertBefore?: number) {
    console.log("called: insertSubtitle", query, insertBefore)
    if (!query) {
      console.error("insertSubtitle: クエリが指定されていません!", query)
      return
    }
    const preset = this.presets.find(e => e._id === query.presetId)
    const replacers = []
    for (const replacer of query.replace || preset.replace) {
      replacers.push(new RegExp(replacer, "g"))
    }
    let rhtml = query.innerHtml || preset.innerHtml

    for (let i = 0; i < replacers.length; i += 1) {
      rhtml = rhtml.replace(replacers[i], (query.text || preset.text)[i] || "")
    }

    const el = document.createElement("div")
    el.classList.add("wrapper", query._id, query.presetId)
    const style = document.createElement("style")
    style.textContent = query.style || preset.style
    el.appendChild(style)
    el.innerHTML = rhtml
    el.dataset.id = query._id
    el.dataset.presetId = query.presetId
    const timeout = query.timeout || preset.timeout || 0
    el.dataset.timeout = timeout && timeout !== 0 ? `${timeout}` : null

    const ibTest = $.num.min(0).max(this.client.childElementCount - 1).ok(insertBefore)
    const subtitle = (() => {
      if (ibTest) {
        return this.client.insertBefore(el, this.client.children.item(insertBefore))
      }
      return this.client.insertAdjacentElement("beforeend", el)
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
    default:
      subtitle.style.transformOrigin = "center"
      break
    }

    const clientBcr = this.client.getBoundingClientRect()

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
        } else if (query.stretch) {
          scaleXs.push(wratio)
        }

        const hratio = clientBcr.height / subtitleBcr.height
        if (hratio < 1) {
          // 何もしない
        } else if (query.stretch) {
          scaleYs.push(hratio)
        }
      }
    }
    const scaleX = scaleXs.length > 0 ? Math.max(...scaleXs) : 1
    const scaleY = scaleYs.length > 0 ? Math.max(...scaleYs) : 1
    subtitle.style.transform = `scale(${scaleX}, ${scaleY})`

    if ((query.func && query.func !== "") || (preset.func && preset.func !== "")) {
      const func = (
        new Function("subtitle", "query", "preset", query.func || preset.func)
      ).bind(this, subtitle, query, preset)
      func()
    }
  }

  public show(target: number) {
    console.log("called: show", target)
    if (this.setTimeout) clearTimeout(this.setTimeout)
    this.setTimeout = null
    if (this.subtitles.length === 0) return
    else if (this.subtitles.length === 1) {
      this.showing = 0
      this.subtitles[0].classList.add("show")
      this.subtitles[0].classList.remove("hide")
      for (const item of Array.from(this.subtitles[0].children)) {
        item.classList.add("show")
        item.classList.remove("hide")
      }
      return
    }
    this.showing = target % this.subtitles.length
    for (let i = 0; i < this.subtitles.length; i += 1) {
      const subtitle = this.subtitles[i]
      if (i === this.showing) {
        subtitle.classList.remove("hide")
        subtitle.classList.add("show")
        for (const item of Array.from(subtitle.children)) {
          item.classList.remove("hide")
          item.classList.add("show")
        }
        subtitle.style.zIndex = String(1 * (this.options.reverse ? -1 : 1))
        const timeout = Number(subtitle.dataset.timeout)
        if (timeout && timeout > 0 && !this.setTimeout) {
          this.setTimeout = setTimeout(this.show.bind(this, i + 1), timeout) as any as number
        }
      } else {
        subtitle.classList.add("hide")
        subtitle.classList.remove("show")
        for (const item of Array.from(subtitle.children)) {
          item.classList.add("hide")
          item.classList.remove("show")
        }
        subtitle.style.zIndex = String(1 * (this.options.reverse ? 1 : -1))
      }
    }

  }
}
