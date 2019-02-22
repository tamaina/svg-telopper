<template lang="pug">
v-app(dark)#vapp
  navbar(v-if="$store.state.obsInfo.connected" :title="$store.state.obsInfo.scName")
  navbar(v-else :title="$t('obs-not-connected')")
  v-content#vappcontent
    v-container(grid-list-xs fluid).h-100
      v-layout(row wrap).justify-center.h-100
        scene-list
        source-list
        v-flex(xs3)
          v-layout(column)
            render-instance-setting
            query-list
        query-editor
  #disconnected(v-show="!$store.state.socketConnected")
    v-card.disconnected-inner.pa-5.ma-auto {{ $t("disconnected") }}
</template>

<script lang="ts">
import Vue from "vue"
import { I18n } from "./i18n"
import Navbar from "./components/navbar.vue"
import sceneList from "./components/scene-list.vue"
import sourceList from "./components/source-list.vue"
import queryList from "./components/query-list.vue"
import queryEditor from "./components/query-editor.vue"
import renderInstanceSetting from "./components/render-instance-setting.vue"

const i18n = I18n("app")

export default Vue.extend({
  i18n,
  components: {
    Navbar,
    sceneList,
    sourceList,
    queryList,
    queryEditor,
    renderInstanceSetting
  }
})
</script>

<style lang="stylus">
#vapp
  width: 100%
  height: 100%

#vappcontent
  position: absolute
  height: calc(100vh - 64px)
  margin-top: 64px
  width: 100%

#disconnected
  width: 100%
  height: 100%
  position: fixed
  display: flex;
  background: rgba(0,0,0,.5)
  height: 100%
</style>
