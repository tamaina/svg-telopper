import $ from "cafy"
import equal from "deep-equal"
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
      activeScenes: [],
      sceneMultipleAndOr: "and",
      renderInstances: [],
      presets: [],
      queriesShowing: [],
      activeSources: [],
      selectedRenderInstances: [] as string[],
      editingQueries: [] as string[]
    },
    mutations: {
      set(state, x: { key: string; value: any }) {
        console.log("set", x)
        nestedProperty.set(state, x.key, x.value)
      },
      // 配列にプッシュします
      push(state, x: { key: string; value: any }) {
        console.log("push", x)
        // 対象が配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr().ok(target)) return
        target.push(x.value)
        nestedProperty.set(state, x.key, target)
      },
      // 配列の要素をテスト(ディープイコール)して除外します
      remove(state, x: { key: string; value: any }) {
        console.log("remove", x)
        // 対象が配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr().ok(target)) return
        nestedProperty.set(state, x.key, target.filter(e => !equal(e, x.value)))
      },
      // 配列の要素をテストして除外します
      removeByKeyTest(state, x: { key: string; testKey: string; testValue: any }) {
        console.log("removeByKeyTest", x)
        // 対象がオブジェクトの配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr($.obj()).ok(target)) return
        nestedProperty.set(state, x.key, target.filter(e => !equal(e[x.testKey], x.testValue, { strict: true })))
      },
      // 配列の要素をテストしてアップデートします
      updateByKeyTest(state, x: { key: string; value: any; testKey: string; testValue: any }) {
        console.log("updateByKeyTest", x)
        // 対象がオブジェクトの配列でなければやめる
        const target = nestedProperty.get(state, x.key)
        if (!target || !$.arr($.obj()).ok(target)) return
        nestedProperty.set(state, x.key, target.map(
          e => equal(e[x.testKey], x.testValue, { strict: true }) ? x.value : e))
      }
    },
    modules: {
      obsInfo
    }
  })

  store.watch(state => state.activeScenes, (newVal, oldVal) => {
    if (newVal.length === 1 && newVal[0]) store.commit("obsInfo/changeScene", ["previewing", newVal[0]])
  })
  store.watch(state => (state as any).obsInfo.scenePreviewing, (newVal, oldVal) => {
    if (store.state.activeScenes.length === 1) store.commit("set", { key: "activeScenes", value: newVal})
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
        {
          key: "renderInstances",
          value: data.body.query,
          testKey: "renderInstanceId",
          testValue: data.body.query.renderInstanceId })
      break
    case "renderInstanceRemoved":
      store.commit("removeByKeyTest",
        {
          key: "renderInstances",
          testKey: "renderInstanceId",
          testValue: data.body.renderInstanceId
        })
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
    case "queriesRemoved":
      for (const id of data.body.ids) {
        store.commit("removeByKeyTest",
          { key: "presets", testKey: "_id", testValue: id })
        store.commit("removeByKeyTest",
          { key: "queriesShowing", testKey: "_id", testValue: id })
      }
      break
    }
  })

  socket.operate("obs/info", {})
  socket.operate("renderInstance/list", {}).then(data => {
    if (!data.renderInstances) return
    store.commit("set", { key: "renderInstances", value: data.renderInstances })
  })
  socket.operate("query/list", {
    isPreset: true
  }).then(data => {
    console.log(data)
    if (data.queries === undefined) return
    store.commit("set", { key: "presets", value: data.queries })
  })

  return store
}
