import * as nestedProperty from "nested-property"
import Vuex from "vuex"
import createPersistedState from "vuex-persistedstate"
import { Socket } from "../../scripts/socket"
import ObsInfo from "./obsInfo"

export const Store = (socket: Socket) => {
  const [ obsInfo ] = [ ObsInfo(socket) ]

  return new Vuex.Store({
    plugins: [createPersistedState()],
    state: {
      hoge: "fuga"
    },
    mutations: {
    },
    modules: {
      obsInfo
    }
  })
}
