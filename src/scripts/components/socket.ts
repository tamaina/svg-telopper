import ReconnectingWebSocket from "reconnecting-websocket"
import { ISocketData } from "../../models/socketData"

export const pass = (data: ISocketData, socket: ReconnectingWebSocket) => {
  socket.send(JSON.stringify(data))
}

export const newSocket = () => {
  const socket = new ReconnectingWebSocket(`ws://${location.host}/`, ["echo-protocol", "soap", "xmpp"])
  socket.addEventListener("open", ev => {
    pass({ type: "ping", body: { t: (new Date()).getTime() } }, socket)
  })
  return socket
}
