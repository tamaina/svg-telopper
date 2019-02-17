import * as colors from "colors"
import * as log from "fancy-log"
import * as OBSWebSocket from "obs-websocket-js"
import { STServer } from "."
import { config } from "../config"
import { ISocketBroadData } from "../models/socketData"
import db from "./db"

export const obsSocket = (server: STServer) => {
  const obs = new OBSWebSocket()
  log("OBSのWebSocketに接続します...")
  log(config.obs)

  const reconnect = (info: string) => {
    log(info.red)
    obs.disconnect()
    db.obsSources.remove({}, { multi: true })
    if (server.obs) {
      setTimeout(obsSocket, 20000)
      const i = server.obs
      server.obs = null
      server.obsInfo = {
        connected: false,
        scName: null,
        scenes: [],
        currentScene: null,
        scenePreviewing: null,
        studioMode: false
      }
    }
  }

  const broadcastData = (type: string, data: { [key: string]: any }) => {
    server.broadcastData({
      body: {
        data,
        type
      },
      type: "obsRecievedData"
    } as ISocketBroadData)
  }

  const updateObs = async () => {
    db.renewObs()

    const [ { scName }, sceneList, sourcesList, { studioMode } ] = await Promise.all([
      obs.send("GetCurrentSceneCollection"),
      obs.send("GetSceneList"),
      obs.send("GetSourcesList"),
      obs.send("GetStudioModeStatus")
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
          { $addToSet: { scenes: scene.name } },
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
        { $addToSet: { children: { $each: ((groupSettings[i] as any).sourceSettings).items.map(e => e.name) }} },
        {}
      ))
    }

    const scenePreviewing = studioMode ? (await obs.send("GetPreviewScene")).name : sceneList.currentScene

    server.obsInfo = {
      connected: true,
      scName,
      scenes,
      currentScene: sceneList.currentScene,
      scenePreviewing,
      studioMode
    }
    server.broadcastData({ type: "update", body: { type: "obsInfo", obsInfo: server.obsInfo }})

    await Promise.all(updates)

// tslint:disable-next-line: max-line-length
    if (process.env.NODE_ENV === "development") log(`ObsInfo: シーンコレクション:${server.obsInfo.scName}, ソース数${await db.obsSources.count({})}, シーン数${server.obsInfo.scenes.length}`)
  }

  const doUpdateObs = () => {
    updateObs()
    .catch(() => {
      reconnect("OBSのWebSocketからの情報の取得に失敗しました。20秒後に再接続を試みます。")
    })
  }

  obs.on("PreviewSceneChanged", data => {
    server.obsInfo.scenePreviewing = data.sceneName
    broadcastData("PreviewSceneChanged", data)
  })
  obs.on("SwitchScenes", data => {
    server.obsInfo.currentScene = data.sceneName
    broadcastData("SwitchScenes", data)
  })
  obs.on("SceneCollectionChanged", () => {
    doUpdateObs()
  })
  obs.on("StudioModeSwitched", data => {
    if (data.newState) {
      server.obsInfo.studioMode = true
      broadcastData("StudioModeSwitched", data)
      obs.send("GetPreviewScene")
      .then(ps => {
        server.obsInfo.scenePreviewing = ps.name
      })
    } else {
      server.obsInfo.studioMode = false
      server.obsInfo.scenePreviewing = null
    }
  })

  obs.on("Exiting", () => {
    reconnect("OBSのWebSocketが切断されました。")
  })

  obs.connect(config.obs)
    .then(async () => {
      log("OBSのWebsocketへの接続に成功しました。")
      server.obs = obs
      return await updateObs()
    }, err => {
      throw new Error(err)
    })
    .then(async () => {
      setInterval(doUpdateObs, 1000)

      obs.send("SetHeartbeat", { enable: true }, err => {
        if (err) {
          log(err)
        }
        let last = new Date()
        obs.on("Heartbeat", () => {
          last = new Date()
          setTimeout(() => {
            if ((new Date()).getTime() - last.getTime() > 4000) {
              reconnect("OBSのWebSocketから応答がありません。20秒後に再接続を試みます。")
            }
          }, 5000)
        })
      })
    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
      log(err)
      reconnect("OBSのWebSocketへの接続に失敗しました。20秒後に再接続を試みます。")
    })
}
