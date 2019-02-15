import * as log from "fancy-log"
import * as OBSWebSocket from "obs-websocket-js"
import { STServer } from "."
import { config } from "../config"
import { ISocketBroadData } from "../models/socketData"
import { broadcast } from "./broadcast"
import db from "./db"

export const obsSocket = (server: STServer) => {
  const obs = new OBSWebSocket()
  log("OBSのWebSocketに接続します...")
  log(config.obs)

  const broadcastData = (data: { [key: string]: any }) => {
    broadcast({
      body: data,
      type: "obsRecievedData"
    } as ISocketBroadData, server.ws)
  }

  const obsInit = async () => {
    const [ { scName }, sceneList, sourcesList ] = await Promise.all([
      obs.send("GetCurrentSceneCollection"),
      obs.send("GetSceneList"),
      obs.send("GetSourcesList")
    ])
    const scenes = sceneList.scenes.map(e => e.name)

    await db.obsSources.insert((sourcesList.sources as any[]).map(e => {
      return {
        scenes: [],
        children: [],
        name: e.name,
        type: e.typeId
      }
    }))

    const updates = []
    for (const scene of sceneList.scenes) {
      db.obsScenes.insert(
        { name: scene.name, items: scene.sources.map(e => e.name) }
      )
      for (const source of scene.sources) {
        updates.push(db.obsSources.update(
          { name: source.name },
          { $push: { scenes: scene.name } },
          {}
        ))
      }
    }

    const groups = await db.obsSources.find({type: "group"})
    const groupSettings = await Promise.all(groups.map(e => {
      return obs.send("GetSourceSettings", { sourceName: e.name })
    }))
    for (let i = 0; i < groups.length; i += 1) {
      updates.push(db.obsSources.update(
        { name: groups[i].name },
        { $addToSet: { children: { $each: ((groupSettings[i] as any).sourceSettings).items.map(e => e.name) }} }
      ))
    }

    server.obsInfo = { scName, scenes }
    broadcastData(Object.assign({ type: "obsDataFullChanged" }, server.obsInfo))

    return Promise.all(updates)
  }

  obs.on("PreviewSceneChanged", data => broadcastData(data))
  obs.on("SwitchScenes", data => broadcastData(data))
  obs.on("Exiting", () => {
    log("OBSのWebSocketが切断されました。20秒後に再接続を試みます。")
    obs.disconnect()
    db.obsSources.remove({}, { multi: true })
    server.obs = null
    setTimeout(obsSocket.bind(null, server), 20000)
  })

  obs.connect(config.obs)
    .then(async () => {
      log("OBSのWebsocketへの接続に成功しました。")
      server.obs = obs
      await Promise.all([
        db.obsScenes.remove({}),
        db.obsSources.remove({})
      ])
      return await obsInit()
    }, err => {
      throw new Error(err)
    })
    .then(async () => {
      log("OBSから情報を取得しました。")
// tslint:disable-next-line: max-line-length
      log(`シーンコレクション:${server.obsInfo.scName}, ソース数${await db.obsSources.count({})}, シーン数${server.obsInfo.scenes.length}`)
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
              db.obsSources.remove({}, { multi: true })
              server.obs = null
              setTimeout(obsSocket.bind(null, server), 20000)
            }
          }, 5000)
        })
      })
    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
      log("OBSのWebSocketへの接続に失敗しました。20秒後に再接続を試みます。")
      log(err)
      server.obs = null
      db.obsSources.remove({}, { multi: true })
      setTimeout(obsSocket.bind(null, server), 20000)
    })
}
