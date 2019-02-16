export type IQueries = IQuery[]

export interface IQuery {
  presetId?: string
  name?: string
  _id?: string
  text: string[]
  innerHtml: string
  replace: string[]
  interval: number
  class: string
  reverse: boolean
  stretch: boolean
  insertBefore: number
  function: string
  anchor: "start" | "end" | "middle"
}
