import * as colors from "colors"
import * as log from "fancy-log"
import { createServer, Server } from "http"
import * as OBSWebSocket from "obs-websocket-js"
import { server as wsServer } from "websocket"
import { config } from "../config"
import { IObsInfo } from "../models/obs"
import { ISocketBroadData, ISocketMessageData } from "../models/socketData"
import app from "./app"
import { obsSocket } from "./obsSocket"
import { pkg } from "./pkg"
import { socket } from "./socket"

export class STServer {
  public obs: OBSWebSocket = null
  public obsInfo: IObsInfo = null
  public ws: wsServer = null
  public httpServer: Server = null

  constructor() {
    log(`SVG Telopper v${pkg.version} Server Starting...`)

    this.httpServer = createServer(app.callback())
    socket(this)
    this.httpServer.listen(config.port)
    log(`サーバーを開始しました。${config.url.green}`)
    obsSocket(this)
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
