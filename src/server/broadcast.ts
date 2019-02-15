import { server } from "websocket"

export const broadcast = (data: { [key: string]: any }, ws: server) => {
  ws.broadcast(JSON.stringify(data))
  return
}
