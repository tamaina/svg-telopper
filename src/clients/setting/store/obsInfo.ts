import * as nestedProperty from "nested-property"
import { IObsInfo } from "../../../models/obs"
import { isNULL } from "../../scripts/preludes"
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
    renew(state, recievedObsInfo: IObsInfo) {
      state.connected = recievedObsInfo.connected
      state.scName = recievedObsInfo.scName
      state.scenes = recievedObsInfo.scenes
      state.currentScene = recievedObsInfo.currentScene
      if (!isNULL(state.scenePreviewing)) state.scenePreviewing = recievedObsInfo.scenePreviewing
      state.studioMode = recievedObsInfo.studioMode
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
