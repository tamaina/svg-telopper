import * as colors from "colors"
import * as log from "fancy-log"
import { createServer, Server } from "http"
import * as OBSWebSocket from "obs-websocket-js"
import { server as wsServer } from "websocket"

import { config } from "../config"
import { IObsInfo } from "../models/obs"
import { ISocketBroadData, ISocketMessageData } from "../models/socketData"
import app from "./app"
import db from "./db"
import { obsSocket } from "./obsSocket"
import { pkg } from "./pkg"
import { socket } from "./socket"

export class STServer {
  public obs: OBSWebSocket = null
  public obsInfo: IObsInfo = {
    connected: false,
    scName: null,
    currentScene: null,
    scenes: [],
    scenePreviewing: null,
    studioMode: false
  }
  public ws: wsServer = null
  public httpServer: Server = null

  constructor() {
    log(`SVG Telopper v${pkg.version} Server Starting...`)

    obsSocket(this)
    this.httpServer = createServer(app.callback())
    socket(this)
    db.renderInstances.update({}, { $set: { connectionCount: 0 } }, { multi: true })

    this.httpServer.listen(config.port)
    log(`サーバーを開始しました。${colors.green(config.url)}`)
  }

  public broadcastData(data: ISocketBroadData) {
    this.ws.broadcast(JSON.stringify(data))
  }

  public message(comment: string, type: "info" | "error" | "warn", data?: any) {
    this.broadcastData({
      type: "message",
      body: {
        comment,
        type,
        data
      }
    } as ISocketMessageData)

    log[type](comment, data)
  }
}

export const server = new STServer()
