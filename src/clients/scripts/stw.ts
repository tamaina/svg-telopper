import $ from "cafy"
import equal from "deep-equal"
import { IPresetQuery, IQuery, IRenderInstanceQuery, ISTWOptions } from "../../models/queries"
import { ISocketData } from "../../models/socketData"
import { Socket } from "./socket"

export class STW {
  public instance: ISTWOptions
  public initialized: boolean = false
  public showing: string
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
    this.renderInstanceId = renderInstanceId
    this.socket = socket

    socket.socket.addEventListener("message", ev => {
      if (!$.str.ok(ev.data)) return
      const data = JSON.parse(ev.data) as ISocketData
      const riid = data.body.instance ?
                    (data.body.instance.renderInstanceId || data.body.renderInstanceId) : data.body.renderInstanceId
      if (
        // data.bodyがない もしくは
        !data.body ||
        !$.optionalNullable.str.match(new RegExp(renderInstanceId)).ok(riid)
      ) return
      switch (data.body.type) {
        case "initializeRenderInstance":
          this.init(data.body, root)
          break
        case "renderInstanceUpdated":
          this.updateRInfo(data.body)
          break
        case "showRenderInstanceSubtitle":
          this.show(data.body.targetId)
          break
        case "queryUpdated":
          this.updateQuery(data.body.query)
          break
      }
    })
  }

  // initです。「initializeRenderInstance」を受け取ることで起動します。
  public async init(body, root: HTMLElement) {
    if (this.initialized) return
    this.initialized = true
    this.presets = await this.socket.operate("query/list", {
      isPreset: true
    }).then(res => res.queries)

    for (const preset of this.presets) {
      const style = document.createElement("style")
      style.id = `stw_style_${preset._id}`
      style.textContent = preset.style
      document.head.appendChild(style)
    }

    this.instance = body.instance
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
    this.client.style.width = body.instance.clientWidth || "80%"
    this.client.style.height = body.instance.clientHeght || "80%"
    if (body.instance.queries && body.instance.queries.length > 0) {
      this.insertSubtitles(body.instance.queries)
        .then(() => {
          const showingQueryId = body.instance.showingQueryId
          this.show(showingQueryId)
        })
    }
  }

  public renewAllSubtitles(queries: string[]) {
    this.client.innerHTML = ""
    this.subtitles = []
    this.insertSubtitles(queries)
    .then(() => {
      const showingQueryId = this.showing
      this.show(showingQueryId)
    })
  }

  public async updateRInfo(data) {
    if (this.updating) return
    this.updating = true
    const nextInstance = data.instance
    if (equal(this.instance, nextInstance, { strict: true })) return

    let renewAllSubtitles = false
    if (nextInstance.clientWidth !== this.instance.clientWidth) {
      renewAllSubtitles = true
      this.client.style.width = nextInstance.clientWidth
    }
    if (nextInstance.clientHeight !== this.instance.clientHeight) {
      renewAllSubtitles = true
      this.client.style.height = nextInstance.clientHeight
    }
    this.showing = nextInstance.showingQueryId

    let passed = 0
    if (renewAllSubtitles) this.renewAllSubtitles(nextInstance.queries)
    else {
      const elementsPool = [].concat(this.subtitles) as HTMLElement[]
      for (let i = 0; i < nextInstance.queries.length; i += 1) {
        const query = nextInstance.queries[i]
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
      if ((this.client.children.length || 0) > nextInstance.queries.length - passed) {
        for (let i = nextInstance.queries.length - passed; i < this.client.children.length; i += 1) {
          this.client.removeChild(this.client.children.item(i))
        }
      }
      this.subtitles = Array.from(this.client.children) as HTMLElement[]
    }

    this.show(this.showing)

    this.instance = nextInstance
    this.updating = false
  }

  public updateQuery(query: IQuery) {
    if (this.updating) return
    this.updating = true
    this.presets = this.presets.map(e => e._id === query._id ? query as IPresetQuery : e)
    const updateTargets = this.subtitles.map(e => {
        if (e.dataset.id === query._id) return { q: 0, e }
        if (e.dataset.presetId === query._id) return { q: 1, e, id: e.dataset.id }
        return null
      })
    for (let i = 0; i < updateTargets.length; i += 1) {
      const target = updateTargets[i]
      if (!target) continue
      if (target.q === 0) {
        this.insertSubtitle(query as IRenderInstanceQuery, i)
        continue
      } else if (target.q === 1) {
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
      this.client.removeChild(target.e)
      this.subtitles.splice(i + 1, 1)
    }
    const style = document.getElementById(`stw_style_${query._id}`)
    if (style) style.textContent = query.style

    this.show(this.showing)
    this.updating = false
  }

  public insertSubtitles(queries: string[]) {
    return this.socket.operate("query/list", {
      ids: queries
    }).then(async queryList => {
      for (const query of queryList.queries.filter(e => e) as IRenderInstanceQuery[]) {
        this.insertSubtitle(query)
      }
    })
  }

  public insertSubtitle(query: IRenderInstanceQuery, insertBefore?: number) {
    if (!query) {
      console.error("insertSubtitle: クエリが指定されていません!", query)
      return
    }

    const preset = this.presets.find(e => e._id === query.presetId)

    const pstyle = document.getElementById(`stw_style_${query._id}`)
    if (pstyle) {
      pstyle.textContent = query.style
    } else {
      const style = document.createElement("style")
      style.id = `stw_style_${query._id}`
      style.textContent = query.style
      document.head.appendChild(style)
    }

    const replacers = []
    for (const replacer of query.replace || preset.replace) {
      replacers.push(new RegExp(replacer, "g"))
    }
    let rhtml = query.innerHtml || preset.innerHtml

    for (let i = 0; i < replacers.length; i += 1) {
      rhtml = rhtml.replace(replacers[i], (query.text || preset.text)[i] || "")
    }

    const el = document.createElement("div")
    el.classList.add("wrapper", `stw-q-${query._id}`, `stw-q-${query.presetId}`)
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

  public show(target: string) {
    if (this.setTimeout) clearTimeout(this.setTimeout)
    this.setTimeout = null
    if (this.subtitles.length === 0) return
    else if (this.subtitles.length === 1) {
      this.showing = null
      this.subtitles[0].classList.add("show")
      this.subtitles[0].classList.remove("hide")
      for (const item of Array.from(this.subtitles[0].children)) {
        item.classList.add("show")
        item.classList.remove("hide")
      }
      return
    }
    this.showing = target
    for (let i = 0; i < this.subtitles.length; i += 1) {
      const subtitle = this.subtitles[i]
      if (subtitle.classList.contains(`stw-q-${target}`)) {
        subtitle.classList.remove("hide")
        subtitle.classList.add("show")
        for (const item of Array.from(subtitle.children)) {
          item.classList.remove("hide")
          item.classList.add("show")
        }
        subtitle.style.zIndex = String(1 * (this.instance.reverse ? -1 : 1))
        const timeout = Number(subtitle.dataset.timeout)
        if (timeout && timeout > 0 && !this.setTimeout) {
          const nextId = i + 1 >= this.subtitles.length ? this.instance.queries[i + 1] : this.instance.queries[0]
          this.setTimeout = setTimeout(this.show.bind(this, nextId), timeout) as any as number
        }
      } else {
        subtitle.classList.add("hide")
        subtitle.classList.remove("show")
        for (const item of Array.from(subtitle.children)) {
          item.classList.add("hide")
          item.classList.remove("show")
        }
        subtitle.style.zIndex = String(1 * (this.instance.reverse ? 1 : -1))
      }
    }

  }
}
