<template lang="pug">
.ss-app
  v-app(dark)
    navbar(v-if="$store.state.obsInfo.connected" :title="$store.state.obsInfo.scName")
    navbar(v-else :title="$t('obs-not-connected')")
    v-layout(row)
      scene-source-list
      div {{ $t("@.renderInstance") }}
</template>

<script lang="ts">
import Vue from "vue"
import { I18n } from "./i18n"
import Navbar from "./components/navbar.vue"
import sceneSourceList from "./components/scene-source-list.vue"

const i18n = I18n("app")

export default Vue.extend({
  i18n,
  components: {
    Navbar,
    sceneSourceList
  }
})
</script>

<style lang="sass">
.ss-app
  width: 100%
  height: 100%
</style>
