<template lang="pug">
v-flex(xs10)
  v-flex(xs5).scene-list
    v-toolbar
      v-toolbar-title {{ $t("@.obs.scene") }}
    v-card
      v-list
        v-list-tile(
          v-for="scene in $store.state.obsInfo.scenes"
          :key="scene"
          v-on:click="listClickedToSend"
          :data-scene="scene"
          v-bind:class="{ active: scene === active, green: scene === active, 'white--text': scene === active }"
        )
          v-list-tile-content
            v-list-tile-title.preview-select {{ scene }}
        v-list-tile(
          v-on:click="listNullClicked"
          data-scene="null"
          v-bind:class="{ active: activeIsNULL, green: activeIsNULL, 'white--text': activeIsNULL }"
        )
          v-list-tile-content
            v-list-tile-title.preview-select {{ $t("not-in-scene") }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n";
import { isNULL } from "../../scripts/preludes"

const i18n = I18n("components/navbar")

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    active() {
      return this.$store.state.obsInfo.scenePreviewing
    },
    activeIsNULL() {
      return isNULL(this.active)
    }
  },
  mounted() {
    this.$store.$watch
  },
  methods: {
    listClickedToSend(ev: MouseEvent) {
      console.log(ev)
      const current = (ev.currentTarget || ev.target) as HTMLElement
      if (current.dataset.scene !== this.active) {
        if (this.$store.state.obsInfo.studioMode) this.$store.commit("obsInfo/changeScene", ["previewing", current.dataset.scene])
        else this.$store.commit("obsInfo/set", { key: "scenePreviewing", value: current.dataset.scene })
      // 2回目に(アクティブな状態でもういちど)押された場合、シーン遷移
      } else this.$store.commit("obsInfo/changeScene", ["current", current.dataset.scene])
    },
    listNullClicked(ev: MouseEvent) {
      console.log(ev)
      const current = (ev.currentTarget || ev.target) as HTMLElement
      if (current.dataset.scene !== this.active) this.$store.commit("obsInfo/set", { key: "scenePreviewing", value: "null" })
    }
  }
})
</script>
<style lang="sass" scoped>
</style>
