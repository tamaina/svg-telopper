import * as log from "fancy-log"
import * as websocket from "websocket"
import db from "./db"

import { STServer } from "."
import { ISocketData, ISocketRequestData } from "../models/socketData"
import operations from "./api/operations"

export const socket = (server: STServer) => {
  server.ws = new websocket.server({
    httpServer: server.httpServer
  })
  server.ws.on("request", request => {
    const connection = request.accept("echo-protocol", request.origin)

    log(`WebSocket接続が開始されました。`)

    connection.on("message", rdata => {
      console.log(rdata)

      connection.on("close", () => {
        log(`WebSocket接続が切断されました。`)
      })

      if (rdata.type === "binary") server.ws.broadcast(rdata.binaryData)
      if (rdata.type !== "utf8") return

      if (rdata.utf8Data.startsWith("{")) {
        const data = JSON.parse(rdata.utf8Data) as ISocketData

        switch (data.type) {
          case "ping":
            connection.send(JSON.stringify({
              body: {
                t: (new Date()).getTime(),
                type: "ping"
              },
              type: "ping"
            } as ISocketData))
            break
          case "renderInstanceInfo":
            switch (data.body.type) {
              case "registerRenderInstance":
                server.ws.broadcast(rdata.utf8Data)
                const { renderInstanceId } = data.body
                log(`新しい描画インスタンスが接続されました: #${renderInstanceId}`)
                db.renderInstances.insert({ renderInstanceId })
                const renderInstanceDied = () => {
                  log(`描画インスタンスは切断されました: #${renderInstanceId}`)
                  return server.ws.broadcast(JSON.stringify({
                    body: {
                      type: "renderInstanceDisconnected"
                    },
                    type: "renderInstanceInfo"
                  } as ISocketData))
                }
                connection.on("close", renderInstanceDied)
                connection.on("error", renderInstanceDied)
                break
            }
          case "request":
            const operation = operations.find(e => e.name === data.body.type)
            operation.exec(server, data as ISocketRequestData)
            .then(res => {
              connection.send(JSON.stringify(
                Object.assign(
                  { type: "response", instance: data.body.instance },
                  res
                )
              ))
            })
          default:
            server.ws.broadcast(rdata.utf8Data)
            break
        }
      }
    })
  })
}
