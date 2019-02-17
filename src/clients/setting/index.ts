import $ from "cafy"
import Vue from "vue"
import VueI18n from "vue-i18n"
import Vuetify from "vuetify/lib"
import Vuex from "vuex"

import vuetifyOption from "./vuetifyOption"

import "vuetify/src/stylus/app.styl"
import "./root.sass"

import { library } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import { IObsInfo } from "../../models/obs"
import { ISocketData } from "../../models/socketData"
import { Socket } from "../scripts/socket"
import App from "./app.vue"
import { I18n } from "./i18n"
import { Store } from "./store/index"

declare global {
  // tslint:disable-next-line: interface-name
  interface Window {
    langs: string[],
    version: string,
    nodeEnv: string
  }
}
Vue.component("font-awesome-icon", FontAwesomeIcon)

import {

} from "@fortawesome/free-solid-svg-icons"

library.add(

)

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify, vuetifyOption)
Vue.mixin({
  methods: {
    destroyDom() {
      this.$destroy()

      if (this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el)
      }
    }
  }
})

const i18n = I18n()

const socket = new Socket()
const store = Store(socket)

const app = new Vue({
  data: {
    hoge: "piyo"
  },
  i18n,
  render: createEl => createEl(App),
  store
})

socket.request({
  type: "obs/info"
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
  }
})

app.$mount("#app")
