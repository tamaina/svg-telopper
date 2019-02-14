import * as log from "fancy-log"
import * as OBSWebSocket from "obs-websocket-js"
import { server } from "websocket"
import { config } from "../config"
import { ISocketData } from "../models/socketData"

export const obsSocket = (ws: server) => {
  const obs = new OBSWebSocket()
  log("OBSのWebSocketに接続します...")
  log(config.obs)

  obs.on("PreviewSceneChanged", data => {
    ws.broadcast(JSON.stringify({
      body: data,
      type: "obsPreviewSceneChanged"
    } as ISocketData))
  })

  obs.on("SwitchScenes", data => {
    ws.broadcast(JSON.stringify({
      body: data,
      type: "obsPreviewSceneChanged"
    } as ISocketData))
  })

  obs.connect(config.obs)
    .then(() => {
      log("OBSのWebsocketへの接続に成功しました。")
      return Promise.all([
        obs.send("GetSceneList")
      ])
    }, err => {
      throw new Error(err)
    })
    .then(data => {
      if (!data) throw new Error("OBS WebSocketから")
      const [ sceneList ] = data

      return Promise.all([
        obs.send("ListSceneCollections"),
        obs.send("GetCurrentSceneCollection")
      ])
    })
    .then(data => {
      console.log(data)

      obs.on("Exiting", () => {
        log("OBSのWebSocketが切断されました。20秒後に再接続を試みます。")
        obs.disconnect()
        setTimeout(obsSocket.bind(null, ws), 20000)
      })

      obs.send("SetHeartbeat", { enable: true }, err => {
        if (err) {
          log(err)
        }
        let last = new Date()
        obs.on("Heartbeat", () => {
          last = new Date()
          setTimeout(() => {
            if ((new Date()).getTime() - last.getTime() > 4000) {
              log("OBSのWebSocketから応答がありません。20秒後に再接続を試みます。")
              obs.disconnect()
              setTimeout(obsSocket.bind(null, ws), 20000)
            }
          }, 5000)
        })
      })
    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
      log("OBSのWebSocketへの接続に失敗しました。20秒後に再接続を試みます。")
      log(err)
      setTimeout(obsSocket.bind(null, ws), 20000)
    })
  return obs
}
