export type IQueries = IQuery[]

export interface IQuery {
  text: string[]
  innerHtml: string
  replace: string[]
  interval: number
  class?: string
  reverse: boolean
  stretch: boolean
  insertBefore: number
  function: string
}
