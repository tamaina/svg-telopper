import { deepStrictEqual } from "assert"
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
  const obs = new OBSWebSocket()
  log("OBSのWebSocketに接続します...")
  log(config.obs)

  const fail = (info: string) => {
    const obsInfo = {
      connected: false,
      scName: null,
      scenes: [],
      currentScene: null,
      scenePreviewing: null,
      studioMode: false
    }
    server.obsInfo = obsInfo
    server.broadcastData({ type: "update", body: { type: "obsInfo", obsInfo }})
    throw new Error(info)
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
    const [ { "sc-name": scName }, sceneList, sourcesList, { "studio-mode": studioMode } ] = await Promise.all([
      obs.send("GetCurrentSceneCollection"),
      obs.send("GetSceneList"),
      obs.send("GetSourcesList"),
      obs.send("GetStudioModeStatus")
    ])
    const sceneNames = sceneList.scenes.map(e => e.name)

    await db.obsScenes.remove({ name: { $nin: sceneNames } }, {})

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
      db.obsSources.remove({ name: { $nin: sourcesList.sources } }, {})
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

    const groups = (await db.obsSources.find({type: "group"})) as any
    const groupSettings = await Promise.all(groups.map(e => {
      return obs.send("GetSourceSettings", { sourceName: (e as any).name })
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

    const scenePreviewing = studioMode ? (await obs.send("GetPreviewScene")).name : sceneList["current-scene"]

    const oldInfo = server.obsInfo
    const newInfo = {
      connected: true,
      scName,
      scenes: sceneNames,
      currentScene: sceneList["current-scene"],
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
    fail("OBSの情報を取得する際、問題が発生しました。")
    }
  }

  const doUpdateObs = () => {
    updateObs()
    .catch(() => {
      fail("OBSのWebSocketからの情報の取得に失敗しました。")
    })
  }

  obs.on("PreviewSceneChanged", data => {
    server.obsInfo.scenePreviewing = data["scene-name"]
    broadcastData("PreviewSceneChanged", data)
  })
  obs.on("SwitchScenes", data => {
    server.obsInfo.currentScene = data["scene-name"]
    broadcastData("SwitchScenes", data)
  })
  obs.on("SceneCollectionChanged", () => {
    doUpdateObs()
  })
  obs.on("StudioModeSwitched", data => {
    if (data["new-state"]) {
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
    fail("OBSのWebSocketが切断されました。")
  })

  await obs.connect(config.obs)
    .then(() => {
      log("OBSのWebsocketへの接続に成功しました。")
      server.obs = obs
    })
    .catch(() => {
      fail("OBSのWebSocketへの接続に失敗しました。")
    })

  updateObs()

  setInterval(doUpdateObs, 5000)

  obs.send("SetHeartbeat", { enable: true })
    .then(() => {
      let last = new Date()
      obs.on("Heartbeat", () => {
        last = new Date()
        setTimeout(() => {
          if ((new Date()).getTime() - last.getTime() > 4000) {
            fail("OBSのWebSocketから応答がありません。")
            throw Error()
          }
        }, 5000)
      })
    })
    .catch(e => log(e))
}
