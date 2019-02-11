import { IQueries, parseQueryString, validateQueries } from "./getQueryString"

export class STW {
  private client: HTMLElement
  private svg: string
  private queries: IQueries
  private subtitles: HTMLElement[]
  private show: number

  constructor() {
    this.client = document.getElementById("client")
    try {
      this.queries = validateQueries(parseQueryString())
    } catch (e) {
      this.client.insertAdjacentText("afterbegin", e)
    }

    this.insertSvgs()
  }

  private insertSvgs() {
    const req = new Request(`./svg/${this.queries.svg}.svg`)
    return fetch(req)
      .then(res => res.text())
      .then(svg => {
        this.svg = svg
        const replacers = []
        for (const replacer of this.queries.replace) {
          replacers.push(new RegExp(replacer, "g"))
        }
        for (const text of this.queries.text) {
          let rsvg = svg
          for (let i = 0; i < replacers.length; i += 1) {
            rsvg = rsvg.replace(replacers[i], text[i])
          }
          this.client.insertAdjacentHTML(
            "beforeend",
            `<div class="wrapper">${rsvg}</div>`
          )
        }
        this.subtitles = Array.from(this.client.children) as HTMLElement[]

        const anchor = this.subtitles[0].getElementsByTagName("text").item(0).style.textAnchor

        let transformOrigin = ""
        switch (anchor) {
        case "start":
          transformOrigin = "left"
          break
        case "end":
          transformOrigin = "right"
          break
        case "middle":
        default:
          transformOrigin = "center"
          break
        }

        for (const subtitle of this.subtitles) {
          subtitle.style.transformOrigin = transformOrigin
        }

        const clientBcr = this.client.getBoundingClientRect()
        for (const subtitle of this.subtitles) {
          subtitle.children.item(0).classList.add("show")
          if (this.queries.class) {
            subtitle.children.item(0).classList.add(this.queries.class)
          }
          const subtitleBcr = subtitle.getElementsByTagName("g").item(0).getBoundingClientRect()
          const transforms = [] as string[]
          console.log(subtitle.getElementsByTagName("g"))

          let wratio = clientBcr.width / subtitleBcr.width
          if (wratio < 1) {
            let subtitleBcr2 = subtitleBcr
            while (subtitleBcr2.width > clientBcr.width) {
              subtitleBcr2 = subtitle.getElementsByTagName("g").item(0).getBoundingClientRect()
              wratio -= 0.0025
              subtitle.style.transform = `scaleX(${wratio})`
            }
            transforms.push(`scaleX(${wratio})`)
          } else if (this.queries.stretch) {
            transforms.push(`scaleX(${wratio})`)
          }

          const hratio = clientBcr.height / subtitleBcr.height
          if (hratio < 1) {
            // 何もしない
          } else if (this.queries.stretch) {
            transforms.push(`scaleY(${hratio})`)
          }

          subtitle.style.transform = transforms.join(" ")
        }
        if (this.subtitles.length > 1) {
          this.show = this.subtitles.length - 1
          this.next()
          setInterval(this.next.bind(this), this.queries.interval)
        }
      })
      .catch(e => {
        this.client.insertAdjacentText("afterbegin", "SVGの読み込み・挿入に失敗しました。")
        this.client.insertAdjacentText("afterbegin", e)
        console.error(e)
      })
  }

  private next() {
    this.show = this.show === this.subtitles.length - 1 ? 0 : this.show + 1
    console.log(this.show)
    for (let i = 0; i < this.subtitles.length; i += 1) {
      const subtitle = this.subtitles[i]
      if (i === this.show) {
        subtitle.children.item(0).classList.add("show")
        subtitle.style.zIndex = String(1 * (this.queries.reverse ? -1 : 1))
      } else {
        subtitle.children.item(0).classList.remove("show")
        subtitle.style.zIndex = String(1 * (this.queries.reverse ? 1 : -1))
      }
    }
  }
}
