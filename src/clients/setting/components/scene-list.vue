<template lang="pug">
v-flex(xs2 v-if="obsConnected").scene-list.h-100
  v-card.st-column
    v-toolbar
      v-toolbar-title {{ $t("@.obs.scene") }}
    v-list
      v-list-tile(
        v-for="scene in $store.state.obsInfo.scenes"
        :key="scene"
        @click="listClicked"
        @click.exact="listClickedWOCtrlShift"
        @click.ctrl.exact="listClickedWCtrlWOShift"
        @click.ctrl="listClickedWCtrlShift"
        @click.shift.exact="listClickedWShiftWOCtrl"
        @click.shift="listClickedWCtrlShift"
        :data-scene="scene"
        :class="{ 'active green white--text': activeScenes.some(e => e === scene) }"
      ).scene
        v-list-tile-content
          v-list-tile-title.preview-select {{ scene }}
      v-list-tile(
        @click="notInSceneClicked"
        :data-scene="null"
        :class="{ 'active green white--text': activeScenes.some(e => e === null) }"
      ).scene
        v-list-tile-content
          v-list-tile-title.preview-select {{ $t("all") }}
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
    activeScenes() {
      return this.$store.state.activeScenes
    },
    obsConnected() {
      return this.$store.state.obsInfo.connected
    }
  },
  mounted() {
    if (!this.$store.state.obsInfo.connected) this.$store.commit("set", { key: "activeScenes", value: [null] })
  },
  methods: {
    notInSceneClicked(ev: MouseEvent) {
      if (
        this.$store.state.activeScenes.some(e => e === null)
      ) {
        // シーンリストから削除
        this.$store.commit("remove", { key: "activeScenes", value: null })
      } else {
        this.$store.commit("set", { key: "activeScenes", value: [null] })
      }
    },
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetScene = current.dataset.scene || null
      if (
      // アクティブで現在のシーンもこれ
        this.$store.state.activeScenes.some(e => e === targetScene) &&
        this.$store.state.obsInfo.currentScene === targetScene
      ) {
        // シーンリストから削除
        this.$store.commit("remove", { key: "activeScenes", value: targetScene })
      } else if (
        // 2回目に(アクティブな状態でもういちど)押された
        this.$store.state.activeScenes.some(e => e === targetScene) &&
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
      if (!this.$store.state.activeScenes.some(e => e === targetScene)) {
        // アクティブではないならシーンリストを置き換え
        this.$store.commit("set", { key: "activeScenes", value: [ targetScene ]})
        // スタジオモード有効時、プレビュー
        if (this.$store.state.obsInfo.studioMode) this.$store.commit("obsInfo/changeScene", ["previewing", targetScene])
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
      if (!this.$store.state.activeScenes.some(e => e === targetScene)) {
        // アクティブではないならシーンリストにpush
        this.$store.commit("push", { key: "activeScenes", value: targetScene })
      }
    }
  },
  watch: {
    obsConnected(newVal, oldVal) {
      if (!newVal) this.$store.commit("set", { key: "activeScenes", value: [null] })
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
</style>
