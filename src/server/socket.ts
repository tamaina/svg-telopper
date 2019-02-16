import * as log from "fancy-log"
import * as websocket from "websocket"
import db from "./db"

import { server } from "."
import { IQuery } from "../models/queries"
import { ISocketData, ISocketRequestData } from "../models/socketData"
import operations from "./api/operations"

const onRenderInstanceConnected = async (
    connection: websocket.connection,
    rdata: websocket.IMessage,
    data: ISocketData
  ) => {
  server.ws.broadcast(rdata.utf8Data)
  const { renderInstanceId } = data.body
  log(`新しい描画インスタンスが接続されました: #${renderInstanceId}`)

  if (await db.renderInstances.findOne({ renderInstanceId })) {
    db.renderInstances.update({ renderInstanceId }, { $inc: { connectionCount: 1 } }, { upsert: true })
  } else {
    const onePreset = await db.presets.findOne({})
    if (!onePreset) {

      return
    }
    db.renderInstances.insert({
      renderInstanceId,
      options: {
        queries: [
          {
            presetId: onePreset._id,
            text: null,
            innerHtml: null,
            replace: null,
            interval: null,
            class: null,
            reverse: null,
            stretch: null,
            insertBefore: null,
            function: null,
            anchor: null
          } as IQuery
        ],
        reverse: false,
        stretch: false
      },
      connectionCount: 1
    })
  }

  const renderInstanceDied = () => {
    log(`描画インスタンスは切断されました: #${renderInstanceId}`)
    db.renderInstances.update({ renderInstanceId }, { $inc: { connectionCount: -1 } }, { upsert: true })
    server.ws.broadcast(JSON.stringify({
      body: {
        type: "renderInstanceDisconnected"
      },
      type: "renderInstanceInfo"
    } as ISocketData))
  }

  connection.on("close", renderInstanceDied)
  connection.on("error", renderInstanceDied)
}

export const socket = () => {
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
                onRenderInstanceConnected(connection, rdata, data)
                break
              default:
                server.ws.broadcast(rdata.utf8Data)
            }
          case "request":
            const operation = operations.find(e => e.name === data.body.type)
            operation.exec(data as ISocketRequestData)
            .then(res => {
              connection.send(JSON.stringify(
                {
                  type: "response",
                  instance: data.instance,
                  body: res
                }
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
