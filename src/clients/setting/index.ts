import $ from "cafy"
import Vue from "vue"
import VueI18n from "vue-i18n"
import Vuetify from "vuetify/lib"
import Vuex from "vuex"

import vuetifyOption from "./vuetifyOption"

import "./root.styl"

import { library } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

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
  faMinus,
  faPen,
  faPlus,
  faSave,
  faTrash
} from "@fortawesome/free-solid-svg-icons"

library.add(
  faMinus,
  faPen,
  faPlus,
  faSave,
  faTrash
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
    socket
  },
  i18n,
  render: createEl => createEl(App),
  store
})

app.$mount("#app")
