import ReconnectingWebSocket from "reconnecting-websocket"
import { ISocketData } from "../../models/socketData"
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
  public request(req: any) {
    return new Promise (resolve => {
      const instance = getUniqueStr()

      const socket = this
      const listener = (ev: MessageEvent) => {
        if (ev.type !== "utf8") return
        const data = JSON.parse(ev.data) as ISocketData
        if (data.type !== "response" || data.instance !== instance) return
        socket.socket.removeEventListener("message", listener)
        resolve(data.body)
      }
      this.socket.addEventListener("message", listener)

      this.pass({
        body: req,
        type: "request",
        instance
      })
    })
  }
}
