import * as colors from "colors"
import * as log from "fancy-log"
import { createServer, Server } from "http"
import * as OBSWebSocket from "obs-websocket-js"
import { server } from "websocket"
import { config } from "../config"
import app from "./app"
import { obsSocket } from "./obsSocket"
import { pkg } from "./pkg"
import { socket } from "./socket"

export interface IObsInfo {
  scName: string
  scenes: string[]
}

export class STServer {
  public obs: OBSWebSocket = null
  public obsInfo: IObsInfo = null
  public ws: server = null
  public httpServer: Server = null

  constructor() {
    log(`SVG Telopper v${pkg.version} Server Starting...`)

    this.httpServer = createServer(app.callback())
    socket(this)
    this.httpServer.listen(config.port)
    log(`サーバーを開始しました。${config.url.green}`)
    obsSocket(this)
  }
}

export default () => new STServer()
