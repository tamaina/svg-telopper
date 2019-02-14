import { ISTWOptions } from "../scripts/components/stw"
import { IQueries } from "./queries"

export interface ISocketData {
  type: "ping" |
        "registerRenderInstance" |
        "initializeRenderInstance" |
        "appendRenderInstanceSubtitles" |
        "removeRenderInstanceSubtitles" |
        "showRenderInstanceSubtitle"|
        "renderInstanceClosed" |
        "obsPreviewSceneChanged"
  body: ISocketDataRegisterRenderInstance |
        ISocketDataInitializeRenderInstance |
        ISocketDataAppendRenderInstanceSubtitles |
        ISocketDataRemoveRenderInstanceSubtitles |
        ISocketDataShowRenderInstanceSubtitle |
        ISocketDataRenderInstanceClosed |
        any
}

export interface ISocketDataRegisterRenderInstance {
  renderInstanceId: string,
  width: number,
  height: number
}

export interface ISocketDataInitializeRenderInstance {
  renderInstanceId: string
  queries: IQueries
  options: ISTWOptions
}

export interface ISocketDataAppendRenderInstanceSubtitles {
  renderInstanceId: string
  queries: IQueries
  showSoon: boolean
}

export interface ISocketDataRemoveRenderInstanceSubtitles {
  renderInstanceId: string
  targets: number[]
}

export interface ISocketDataShowRenderInstanceSubtitle {
  renderInstanceId: string
  target: number
}

export interface ISocketDataRenderInstanceClosed {
  renderInstanceId: string
}
