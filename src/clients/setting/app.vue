<template lang="pug">
v-app(dark)#vapp
  navbar(v-if="$store.state.obsInfo.connected" :title="$store.state.obsInfo.scName")
  navbar(v-else :title="$t('obs-not-connected')")
  v-layout(row)
    scene-list
    source-list
    query-list
    query-editor
</template>

<script lang="ts">
import Vue from "vue"
import { I18n } from "./i18n"
import Navbar from "./components/navbar.vue"
import sceneList from "./components/scene-list.vue"
import sourceList from "./components/source-list.vue"
import queryList from "./components/query-list.vue"
import queryEditor from "./components/query-editor.vue"

const i18n = I18n("app")

export default Vue.extend({
  i18n,
  components: {
    Navbar,
    sceneList,
    sourceList,
    queryList,
    queryEditor
  }
})
</script>

<style lang="stylus">
#vapp
  width: 100%
  height: 100%
</style>
