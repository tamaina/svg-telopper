import * as nestedProperty from "nested-property"
import { IObsInfo } from "../../../models/obs"
import { Socket } from "../../scripts/socket"

export default (socket: Socket) => { return {
  namespaced: true,
  state: {
    connected: false,
    scName: null,
    scenes: [],
    currentScene: null,
    scenePreviewing: null,
    studioMode: false
  } as IObsInfo,
  mutations: {
    set(state, x: { key: string; value: any }) {
      nestedProperty.set(state, x.key, x.value)
    },
    renew(state, res: IObsInfo) {
      state.connected = res ? res.connected : false
      state.scName = res ? res.scName : false
      state.scenes = res ? res.scenes : []
      state.currentScene = res ? res.currentScene : null
      if (state.scenePreviewing) state.scenePreviewing =  res ? res.scenePreviewing : null
      state.studioMode = res ? res.studioMode : false
    },
    changeScene(state, val: string[]) {
      switch (val[0]) {
      case "current":
        state.currentScene = val[1]
        socket.sendToObs("SetCurrentScene", { "scene-name": val[1] })
        break
      case "previewing":
        if (!state.scenePreviewing) return
        state.scenePreviewing = val[1]
        socket.sendToObs("SetPreviewScene", { "scene-name": val[1] })
        break
      }
    }
  }
}}
