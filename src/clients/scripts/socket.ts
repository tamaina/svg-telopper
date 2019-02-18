import $ from "cafy"
import ReconnectingWebSocket from "reconnecting-websocket"
import { ISocketData, ISocketResponseData } from "../../models/socketData"
import { getUniqueStr } from "./getUniqueStr"

export class Socket {
  public socket: ReconnectingWebSocket

  constructor() {
    this.socket = new ReconnectingWebSocket(`ws://${location.host}/`, ["echo-protocol", "soap", "xmpp"])
    this.socket.addEventListener("open", ev => {
      this.pass({ type: "ping", body: { type: "ping", t: (new Date()).getTime() } })
    })
  }
  public pass(data: ISocketData) {
    this.socket.send(JSON.stringify(data))
  }
  public request(req: any, type: "request" | "obsRequestData" = "request"): Promise<ISocketResponseData["body"]> {
    return new Promise (resolve => {
      const instance = getUniqueStr()

      const socket = this
      const listener = (ev: MessageEvent) => {
        if (!$.str.ok(ev.data)) return
        const data = JSON.parse(ev.data) as ISocketResponseData
        if (data.type !== "response" || data.instance !== instance) return
        socket.socket.removeEventListener("message", listener)
        resolve(data.body)
      }
      this.socket.addEventListener("message", listener)

      this.pass({
        body: req,
        type,
        instance
      })
    })
  }
  public sendToObs(type: string, option?: any) {
    return this.request({
      type,
      option
    }, "obsRequestData")
  }
}
