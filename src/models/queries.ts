export interface ISTWOptions {
  queries: string[]
  reverse?: boolean
}
export interface IQuery {
  presetId?: string
  name?: string
  _id?: string
  text: string[]
  innerHtml: string
  replace: string[]
  interval: number
  class: string
  stretch: boolean
  function: string
  anchor: "start" | "end" | "middle"
}

export interface IPresetQuery extends IQuery {
  presetName: string
  _id: string
}

export interface IRenderInstanceQuery extends IQuery {
  presetId: string
  _id: string
}
