import { Scene } from "obs-websocket-js"
import Vuex from "vuex"
import createPersistedState from "vuex-persistedstate"
import { IObsInfo } from "../../../models/obs"
import { Socket } from "../../scripts/socket"

export interface IStoreState {
  obsInfo: IObsInfo,
  renderInstances: IRenderInstanceSetting[]
}

export interface IRenderInstanceSetting {
  renderInstanceId: string
  connections: Array<{ width: number, height: number }>
}

export const Store = (socket: Socket) => new Vuex.Store({
  plugins: [createPersistedState()],
  state: {
    obsInfo: null,
    renderInstances: [],
    sources: []
  } as IStoreState,
  mutations: {
    renewObsInfo(state, obsInfo: IObsInfo) {
      state.obsInfo = obsInfo
    }
  }
})
