import * as log from "fancy-log"
import * as websocket from "websocket"
import db from "./db"

import { STServer } from "."
import { IQuery } from "../models/queries"
import { ISocketData, ISocketRequestData, ISocketResponseData } from "../models/socketData"
import operations from "./api/operations"

const onRenderInstanceConnected = async (
    server: STServer,
    connection: websocket.connection,
    rdata: websocket.IMessage,
    data: ISocketData
  ) => {
  server.ws.broadcast(rdata.utf8Data)
  const { renderInstanceId } = data.body
  log(`新しい描画インスタンスが接続されました: #${renderInstanceId}`)

  const res = {} as any

  if (await db.renderInstances.findOne({ renderInstanceId })) {
    res.body = await db.renderInstances.update(
      { renderInstanceId },
      { $inc: { connectionCount: 1 } },
      { upsert: true, returnUpdatedDocs: true }
    )
  } else {
    const findOnePreset = await db.queries.findOne({})
    const queries = findOnePreset ? [(await db.queries.insert({ presetId: findOnePreset._id }))._id] : []
    const instance = {
      renderInstanceId,
      queries,
      reverse: false,
      showingIndex: 0,
      connectionCount: 1
    }
    res.body = instance
    await db.renderInstances.insert(instance)
    server.ws.broadcast(JSON.stringify({
      type: "response",
      body: {
        type: "renderInstanceCreated",
        instance
      }
    }))
  }
  res.type = "renderInstanceInfo"
  res.body.type = "initializeRenderInstance"
  server.ws.broadcast(JSON.stringify(res))

  const renderInstanceDied = () => {
    log(`描画インスタンスは切断されました: #${renderInstanceId}`)
    db.renderInstances.update({ renderInstanceId }, { $inc: { connectionCount: -1 } }, { returnUpdatedDocs: true })
      .then(instance => {
        server.broadcastData({
          type: "update",
          body: {
            type: "renderInstanceUpdated",
            instance
          }
        })
      })
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
            onRenderInstanceConnected(server, connection, rdata, data)
            break
          case "showRenderInstanceSubtitle":
            db.renderInstances.update({
              renderInstanceId: data.body.renderInstanceId
            }, {
              $set: { showingIndex: data.body.target }
            })
          default:
            server.ws.broadcast(rdata.utf8Data)
          }
          break

        case "operate":
          const operation = operations.find(e => e.name === data.body.type)

          const operationErrored = e => {
            log.error(`Error!: @${data.body.type}`)
            log.error(e)
            connection.send(JSON.stringify(
              {
                type: "response",
                instance: data.instance,
                body: {
                  type: "error",
                  data: e
                }
              }
            ))
          }

          if (!operation) {
            operationErrored("Operation not found")
            break
          }
          try {
            operation.exec(server, data as ISocketRequestData)
            .then(res => {
              connection.send(JSON.stringify(
                {
                  type: "response",
                  instance: data.instance,
                  body: res
                }
              ))
            }, operationErrored)
          } catch (e) {
            operationErrored(e)
          }
          break

        case "obsRequestData":
          server.obs.send(data.body.type as "GetTransitionDuration", data.body.option)
          .then(res => {
            connection.send(JSON.stringify(
              {
                type: "obsResponseData",
                body: {
                  type: data.body.type,
                  res
                },
                instance: data.instance
              }
            ))
          })
          break

        default:
          server.ws.broadcast(rdata.utf8Data)
          break
        }
      }
    })
  })
}
