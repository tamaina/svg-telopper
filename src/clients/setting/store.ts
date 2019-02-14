import { Scene } from "obs-websocket-js"
import Vuex from "vuex"
import createPersistedState from "vuex-persistedstate"

export interface IStoreState {
  obsScenes: Scene[],
  renderInstances: IRenderInstanceSetting[]
}

export interface IRenderInstanceSetting {
  renderInstanceId: string
  connections: Array<{ width: number, height: number }>
}

export const store = new Vuex.Store({
  plugins: [createPersistedState()],
  state: {
    obsScenes: [],
    renderInstances: []
  } as IStoreState,

  mutations: {
    refreshObsScenes(state, newScenes: Scene[]) {
      state.obsScenes = newScenes
    }
  }
})
