import $ from "cafy"
import * as nestedProperty from "nested-property"
import Vuex from "vuex"
import { IObsInfo } from "../../../models/obs"
import { ISocketData } from "../../../models/socketData"
import { Socket } from "../../scripts/socket"
import ObsInfo from "./obsInfo"

export const Store = (socket: Socket) => {
  const [ obsInfo ] = [ ObsInfo(socket) ]

  const store = new Vuex.Store({
    plugins: [],
    state: {
      hoge: "fuga",
      sceneActive: [],
      sceneMultipleAndOr: "and",
      renderInstances: [],
      presets: [],
      queriesShowing: [],
      activeSources: [],
      editingQueries: []
    },
    mutations: {
      set(state, x: { key: string; value: any }) {
        nestedProperty.set(state, x.key, x.value)
      },
      // 配列にプッシュします
      push(state, x: { key: string; value: any }) {
        // 対象が配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr().ok(target)) return
        nestedProperty.set(state, x.key, target.push(x.value))
      },
      // 配列の要素をテストして除外します
      remove(state, x: { key: string; value: any }) {
        // 対象が配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr().ok(target)) return
        nestedProperty.set(state, x.key, target.filter(e => e !== x.value))
      },
      // 配列の要素をテストして除外します
      removeByKeyTest(state, x: { key: string; testKey: string; testValue: any }) {
        // 対象がオブジェクトの配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr($.obj()).ok(target)) return
        nestedProperty.set(state, x.key, target.filter(e => e[x.testKey] === x.testValue ? false : true))
      },
      // 配列の要素をテストしてアップデートします
      updateByKeyTest(state, x: { key: string; value: any; testKey: string; testValue: any }) {
        // 対象がオブジェクトの配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr($.obj()).ok(target)) return
        nestedProperty.set(state, x.key, target.map(e => e[x.testKey] === x.testValue ? x.value : e))
      }
    },
    modules: {
      obsInfo
    }
  })

  store.watch(state => state.sceneActive, (newVal, oldVal) => {
    if (newVal.length === 1 && newVal[0]) store.commit("obsInfo/changeScene", ["previewing", newVal[0]])
  })
  store.watch(state => (state as any).obsInfo.scenePreviewing, (newVal, oldVal) => {
    if (store.state.sceneActive.length === 1) store.commit("set", { key: "sceneActive", value: newVal})
  })

  socket.socket.addEventListener("message", ev => {
    if (!$.str.ok(ev.data)) return
    const data = JSON.parse(ev.data) as ISocketData

    switch (data.type) {
      case "obsRecievedData":
        switch (data.body.type) {
        case "PreviewSceneChanged":
          store.commit("set",
            { key: "scenePreviewing", value: data.body.data.sceneName}
          )
          break
        case "SwitchScenes":
          store.commit("set",
            { key: "currentScene", value: data.body.data.sceneName}
          )
          break
        case "StudioModeSwitched":
          store.commit("set",
            { key: "studioMode", value: data.body.data.newState}
          )
          break
        }
        break
    }

    switch (data.body.type) {
    case "obsInfo":
      store.commit("obsInfo/renew", data.body.obsInfo as IObsInfo)
      break
    case "renderInstanceCreated":
      store.commit("push", { key: "renderInstances", value: data.body.query })
      break
    case "renderInstanceUpdated":
      store.commit("updateByKeyTest",
        { key: "renderInstances", value: data.body.query, testKey: "_id", testValue: data.body.query._id })
      break
    case "renderInstanceRemoved":
      store.commit("removeByKeyTest",
        { key: "renderInstances", testKey: "_id", testValue: data.body.presetId })
      break
    case "queryCreated":
      if (data.body.query.presetName) {
        store.commit("push", { key: "presets", value: data.body.query })
      }
      break
    case "queryUpdated":
      if (data.body.query.presetName) {
        store.commit("updateByKeyTest",
          { key: "presets", value: data.body.query, testKey: "_id", testValue: data.body.query._id })
      } else {
        store.commit("updateByKeyTest",
          { key: "queriesShowing", value: data.body.query, testKey: "_id", testValue: data.body.query._id })
      }
      break
    case "queryRemoved":
      if (data.body.query.presetName) {
        store.commit("removeByKeyTest",
          { key: "presets", testKey: "_id", testValue: data.body.presetId })
      } else {
        store.commit("removeByKeyTest",
          { key: "queriesShowing", testKey: "_id", testValue: data.body.presetId })
      }
      break
    }
  })

  socket.request({
    type: "obs/info"
  })
  socket.request({
    type: "renderInstance/list"
  }).then(data => {
    if (!data.renderInstances) return
    store.commit("set", { key: "renderInstances", value: data.renderInstances })
  })
  socket.request({
    type: "query/list",
    isPreset: true
  }).then(data => {
    if (!data.queries) return
    store.commit("set", { key: "preset", value: data.queries })
  })

  return store
}
