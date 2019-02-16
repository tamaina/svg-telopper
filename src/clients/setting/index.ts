// import ReconnectingWebSocket from "reconnecting-websocket"
import Vue from "vue"
import VueI18n from "vue-i18n"
import Vuetify from "vuetify"
import Vuex from "vuex"

import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import { ISocketData } from "../../models/socketData"
import { Socket } from "../scripts/socket"
import App from "./app.vue"
import { I18n } from "./i18n"
import { Store } from "./store/"

declare global {
  // tslint:disable-next-line: interface-name
  interface Window {
    langs: string[],
    version: string,
    nodeEnv: string
  }
}
Vue.component("font-awesome-icon", FontAwesomeIcon)
library.add(fas)

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify, {
  iconfont: "faSvg"
})
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
const app = new Vue({
  data: {
    hoge: "piyo"
  },
  i18n,
  render: createEl => createEl(App),
  store: Store(socket)
})

socket.request({
  type: "obs/info"
})

socket.socket.addEventListener("message", ev => {
  if (ev.type !== "utf8") return
  const data = JSON.parse(ev.data) as ISocketData
  switch (data.body.type) {
    case "obsInfo":
      app.$store.commit("renewObsInfo", data.body.obsInfo)
  }
})

app.$mount("#app")
