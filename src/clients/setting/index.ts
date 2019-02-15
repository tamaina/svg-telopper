
// import ReconnectingWebSocket from "reconnecting-websocket"
import Vue from "vue"
import VueI18n from "vue-i18n"
import Vuex from "vuex"
// import { newSocket } from "../../scripts/components/socket"
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

// Vue.use(Vuex)
Vue.use(VueI18n)
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
const app = new Vue({
  data: {
    hoge: "piyo"
  },
  i18n,
  render: createEl => createEl(App)/*,
  store*/
})

app.$mount("#app")
