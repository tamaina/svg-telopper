import ReconnectingWebSocket from "reconnecting-websocket"
import { ISocketData } from "../../models/socketData"

export class Socket {
  public socket: ReconnectingWebSocket

  constructor() {
    this.socket = new ReconnectingWebSocket(`ws://${location.host}/`, ["echo-protocol", "soap", "xmpp"])
    this.socket.addEventListener("open", ev => {
      this.pass({ type: "ping", body: { type: "ping", t: (new Date()).getTime() } }, this.socket)
    })
  }
  public pass(data: ISocketData, socket: ReconnectingWebSocket) {
    socket.send(JSON.stringify(data))
  }
}
