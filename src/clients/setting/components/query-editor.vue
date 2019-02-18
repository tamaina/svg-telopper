<template lang="pug">
v-flex(xs5).scene-list
  v-toolbar
    v-toolbar-title {{ presetName || id }}
  v-card
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

const i18n = I18n("components/source-list")

export default Vue.extend({
  name: "source-list-item",
  props: {
    query: Object
  },
  data() {
    return {
      id: null,
      presetName: null,
      text: null,
      innerHtml: null,
      replace: null,
      interval: null,
      class: null,
      stretch: null,
      function: null,
      anchor: null
    }
  },
  computed: {
    preset() {
      if (this.query.presetName || !this.query.presetId) return {}
      return this.$store.presets.find(e => e._id === this.query.presetId)
    }
  },
  mounted() {
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetScene = current.dataset.scene
    }
  },
  watch: {
    sceneActive(newVal, oldVal) {
      this.socket.request({
          type: "obs/getSceneTree",
          sceneNames: newVal,
          andOr: this.$store.state.sceneMultipleAndOr
        })
        .then(res => {
          if (res.type === "sourceSettings") this.sourceList = res.sourceTree
        })
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
      @extend .purple
      @extend .white--text
</style>
