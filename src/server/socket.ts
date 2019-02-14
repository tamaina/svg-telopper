import * as log from "fancy-log"
import * as http from "http"
import * as websocket from "websocket"

import { ISocketData, ISocketDataRenderInstanceClosed } from "../models/socketData"

export const socket = (httpServer: http.Server) => {
  const ws = new websocket.server({
    httpServer
  })
  ws.on("request", request => {
    const connection = request.accept("echo-protocol", request.origin)

    log(`WebSocket接続が開始されました。`)

    connection.on("message", rdata => {
      console.log(rdata)

      connection.on("close", () => {
        log(`WebSocket接続が切断されました。`)
      })

      if (rdata.type === "binary") ws.broadcast(rdata.binaryData)
      if (rdata.type !== "utf8") return

      if (rdata.utf8Data.startsWith("{")) {
        const data = JSON.parse(rdata.utf8Data) as ISocketData

        switch (data.type) {
          case "ping":
            connection.send(JSON.stringify({
              body: {
                t: (new Date()).getTime()
              },
              type: "ping"
            }))
            break
          case "initializeRenderInstance":
            const { renderInstanceId } = data.body
            log(`新しい描画インスタンスが接続されました: #${renderInstanceId}`)
            const renderInstanceDied = () => {
              log(`描画インスタンスは切断されました: #${renderInstanceId}`)
              return ws.broadcast(JSON.stringify({
                body: {
                  renderInstanceId
                } as ISocketDataRenderInstanceClosed,
                type: "renderInstanceClosed"
              } as ISocketData))
            }
            connection.on("close", renderInstanceDied)
            connection.on("error", renderInstanceDied)
          default:
            ws.broadcast(rdata.utf8Data)
        }
      }
    })
  })
  return ws
}
