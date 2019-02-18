<template lang="pug">
v-flex(xs5).scene-list
  v-toolbar
    v-toolbar-title {{ $t("@.obs.scene") }}
  v-card
    v-list
      v-list-tile(
        v-for="scene in $store.state.obsInfo.scenes"
        :key="scene"
        @click="listClicked"
        @click.exact="listClickedWOCtrlShift"
        @clicl.ctrl.exact="listClickedWCtrlWOShift"
        @clicl.ctrl="listClickedWCtrlShift"
        @clicl.shift.exact="listClickedWShiftWOCtrl"
        @clicl.shift="listClickedWCtrlShift"
        :data-scene="scene"
        :class="{ active: sceneActive.some(e => e === scene) }"
      ).scene
        v-list-tile-content
          v-list-tile-title.preview-select {{ scene }}
      v-list-tile(
        @click="listClicked"
        @click.exact="listClickedWOCtrlShift"
        @clicl.ctrl.exact="listClickedWCtrlWOShift"
        @clicl.ctrl="listClickedWCtrlShift"
        @clicl.shift.exact="listClickedWShiftWOCtrl"
        @clicl.shift="listClickedWCtrlShift"
        :data-scene="null"
        :class="{ active: sceneActive.find(e => e === null) }"
      ).scene
        v-list-tile-content
          v-list-tile-title.preview-select {{ $t("not-in-scene") }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

const i18n = I18n("components/scene-list")

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    sceneActive() {
      return this.$store.state.sceneActive
    }
  },
  mounted() {
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetScene = current.dataset.scene || null
      if (
      // アクティブで現在のシーンもこれ
        this.$store.state.sceneActive.some(e => e === targetScene) &&
        this.$store.state.obsInfo.currentScene === targetScene
      ) {
        // シーンリストから削除
        this.$store.commit("remove", { key: "sceneActive", value: targetScene })
      } else if (
      // 2回目に(アクティブな状態でもういちど)押された
        this.$store.state.sceneActive.some(e => e === targetScene) &&
        this.$store.state.obsInfo.currentScene !== targetScene &&
        targetScene
      ) {
        // シーン遷移する
        this.$store.commit("obsInfo/changeScene", ["current", targetScene])
      }
    },
    listClickedWOCtrlShift(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetScene = current.dataset.scene || null
      if (!this.$store.state.sceneActive.some(e => e === targetScene)) {
      // アクティブではないならシーンリストを置き換え
        this.$store.commit("set", { key: "sceneActive", value: [ targetScene ]})
      }
    },
    listClickedWCtrlWOShift(ev: MouseEvent) {
      this.$store.commit("set", { key: "sceneMultipleAndOr", value: "or" })
    },
    listClickedWShiftWOCtrl(ev: MouseEvent) {
      this.$store.commit("set", { key: "sceneMultipleAndOr", value: "and" })
    },
    listClickedWCtrlShift(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetScene = current.dataset.scene || null
      if (!this.$store.state.sceneActive.some(e => e === targetScene)) {
      // アクティブではないならシーンリストにpush
        this.$store.commit("push", { key: "sceneActive", value: targetScene })
      }
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '~vuetify/src/stylus/generic/_colors.styl'
.scene-list
  .scene
    &.actice
      @extend .green
      @extend .white--text
</style>
