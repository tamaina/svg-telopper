import $ from "cafy"
import { parse as parseQs } from "query-string"

export interface IQueries {
  text: string[][]
  svg: string
  replace: string[]
  interval: number
  class?: string
  reverse: boolean
  stretch: boolean
}

export interface IExpectedQueries {
  text: string | string[]
  svg: string
  replace?: string | string[]
  interval?: string
  class?: string
  reverse?: string
  stretch?: string
}

export const parseQueryString = (): any => {
  return parseQs(location.search)
}

export const validateQueries = (eq: IExpectedQueries): IQueries => {
  const res = {} as IQueries
  const errors = [] as string[]

  /* replace */
  if ($.str.ok(eq.replace)) {
    res.replace = [eq.replace as string]
  } else if ($.arr($.str).ok(eq.replace)) {
    res.replace = eq.replace as string[]
  } else if (eq.replace) {
    errors.push("値'replace'が間違っているようです。")
  } else {
    res.replace = ["ここに文章を入力"]
  }

  /* text */
  if ($.str.ok(eq.text) && res.replace.length === 1) {
    res.text = [[ eq.text as string ]]
  } else if ($.arr($.str).min(res.replace.length).ok(eq.text)) {
    if (eq.text.length === res.replace.length) res.text = [eq.text as string[]]
    else if (eq.text.length % res.replace.length === 0) {
      res.text = []
      for (let i = 0; i < (eq.text.length / res.replace.length); i += 1) {
        const j = i * res.replace.length
        res.text.push((eq.text as string[]).slice(j, j + res.replace.length))
      }
    } else {
      errors.push("値'text'が間違っているようです。textはreplaceで指定した倍数分指定する必要があります。")
    }
  } else {
    errors.push("値'text'が間違っているようです。?text=ひとつめ(&text=ふたつめ&text=みっつめ) のように指定しましょう。replaceが複数の場合、その長さの分だけ指定する必要があります。")
  }

  /* svg */
  if ($.str.ok(eq.svg)) {
    if (eq.svg.endsWith(".svg")) {
      res.svg = eq.svg.slice(0, -4)
    } else {
      res.svg = eq.svg
    }
  } else {
    errors.push("値'svg'が間違っているようです。文字列で指定しましょう。")
  }

  /* interval */
  if (eq.interval && $.str.ok(eq.interval)) {
    res.interval = parseInt(eq.interval, 10)
  } else if (!eq.interval) {
    res.interval = 7000
  }
  if (eq.interval && !res.interval) {
    errors.push("値'interval'が間違っているようです。数値で指定しましょう。")
  }

  /* class */
  if ($.str.ok(eq.class)) {
    res.class = eq.class
  } else if (eq.class) {
    errors.push("値'class'が間違っているようです。")
  }

  /* reverse */
  try {
    res.reverse = convertBoolean(eq.reverse)
  } catch (e) {
    errors.push("値'reverse'が間違っているようです。")
  }

  /* stretch */
  try {
    res.stretch = convertBoolean(eq.stretch)
  } catch (e) {
    errors.push("値'stretch'が間違っているようです。")
  }

  if (errors.length > 0) {
    throw Error(errors.join("\n"))
  }
  return res
}

function convertBoolean(str: string) {
  if (str === "true") return true
  else if (str === "1") return true
  else if (str === "") return true
  else if (str === null) return true
  else if (str === "false") return false
  else if (str === "0") return false
  else if (str) {
    throw Error("指定された形式ではないようです。")
  }
}
