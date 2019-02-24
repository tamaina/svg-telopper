import { deepStrictEqual } from "assert"
import * as retry from "async-retry"
import * as log from "fancy-log"
import * as OBSWebSocket from "obs-websocket-js"

import { STServer } from "."
import { config } from "../config"
import { IObsInfo } from "../models/obs"
import { ISocketBroadData } from "../models/socketData"
import db from "./db"

function equal(a: any, b: any) {
  try {
    deepStrictEqual(a, b)
    return true
  } catch (e) {
    return false
  }
}

export const obsSocket = async (server: STServer) => {
  let reconnecting = false
  const obs = new OBSWebSocket()
  log("OBSのWebSocketに接続します...")
  log(config.obs)

  const reconnect = (info: string) => {
    if (reconnecting) return
    reconnecting = true
    server.obsInfo = {
      connected: false,
      scName: null,
      scenes: [],
      currentScene: null,
      scenePreviewing: null,
      studioMode: false
    }
    throw new Error("OBSに接続できませんでした。")
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
    try {
    const [ { scName }, sceneList, sourcesList, { studioMode } ] = await Promise.all([
      obs.send("GetCurrentSceneCollection"),
      obs.send("GetSceneList"),
      obs.send("GetSourcesList"),
      obs.send("GetStudioModeStatus")
    ])
    const sceneNames = sceneList.scenes.map(e => e.name)

    await db.obsScenes.remove({ name: { $nin: sceneList.scenes.map(e => e.name) } })

    const renewSourcesPromises = [] as Array<Promise<any>>
    for (const source of sourcesList.sources as any[]) {
      renewSourcesPromises.push(db.obsSources.update(
        { name: source.name },
        {
          scenes: [],
          groups: [],
          children: [],
          name: source.name,
          type: source.typeId
        },
        { upsert: true }
      ))
    }
    renewSourcesPromises.push(
      db.obsScenes.remove({ name: { $nin: sceneList.scenes.map(e => e.name) } })
    )

    await Promise.all(renewSourcesPromises)

    const updates = [] as Array<Promise<any>>

    for (const scene of sceneList.scenes) {
      db.obsScenes.update(
        { name: scene.name },
        { name: scene.name, items: scene.sources.map(e => e.name) },
        { upsert: true }
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
      const children = ((groupSettings[i] as any).sourceSettings).items.map(e => e.name)
      updates.push(db.obsSources.update(
        { name: groups[i].name },
        { $addToSet: { children: { $each: children }} },
        {}
      ))
      updates.push(...children.map(e => db.obsScenes.update(
        { name: e },
        { $addToSet: { groups: { $each: groups[i].name }} },
        {}
      )))
    }

    const scenePreviewing = studioMode ? (await obs.send("GetPreviewScene")).name : sceneList.currentScene

    const oldInfo = server.obsInfo
    const newInfo = {
      connected: true,
      scName,
      scenes: sceneNames,
      currentScene: sceneList.currentScene,
      scenePreviewing,
      studioMode
    } as IObsInfo
    if (!equal(oldInfo, newInfo)) {
      server.broadcastData({ type: "update", body: { type: "obsInfo", obsInfo: newInfo }})
      server.obsInfo = newInfo
    }
    await Promise.all(updates)
// tslint:disable-next-line: max-line-length
    if (process.env.NODE_ENV === "development") log(`ObsInfo: シーンコレクション:${newInfo.scName}, ソース数${await db.obsSources.count({})}, シーン数${server.obsInfo.scenes.length}`)
    } catch (e) {
    reconnect("OBSの情報を取得する際、問題が発生しました。")
    }
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

  await obs.connect(config.obs)
    .then(() => {
      log("OBSのWebsocketへの接続に成功しました。")
      server.obs = obs
    })
    .catch(() => {
      reconnect("OBSのWebSocketへの接続に失敗しました。20秒後に再接続を試みます。")
    })

  updateObs()

  setInterval(doUpdateObs, 5000)

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
          throw Error()
        }
      }, 5000)
    })
  })
}
