<template lang="pug">
v-flex(xs5).source-list
  v-toolbar
    v-toolbar-title {{ $t("@.obs.source") }}
  v-card
    v-list
      v-list-tile(
        @click="presetClicked"
        :data-source-name="false"
        v-bind:class="{ active: selectedPreset }"
      ).preset
        v-list-tile-content
          v-list-tile-title.preview-select {{ $t("@.words.preset") }}
      source-list-item(
        v-for="source in sourceList"
        :source="source"
        :active="activeItems.some(e => e === scene)"
        :key="source.name"
        :activeItems="activeItems"
      )
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"
import sourceListItem from "./source-list-item.vue"

const i18n = I18n("components/source-list")

export default Vue.extend({
  components: {
    sourceListItem
  },
  data() {
    return {
      sourceList: [],
      activeItems: [],
      selectedPreset: true
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
    presetClicked(ev: MouseEvent) {
      this.selectedPreset = !this.selectedPreset
      if (this.selectedPreset) {
        this.$store.commit("set", { key: "queriesShowing", value: this.$store.state.presets })
        this.activeItems = []
      } else {
        this.$store.commit("set", { key: "queriesShowing", value: [] })
      }
    },
  },
  watch: {
    sceneActive(newVal, oldVal) {
      this.$root.socket.request({
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
.source-list
  .source
    &.active
      @extend .purple
      @extend .white--text
  .preset
    @extend .red--text
    &.active
      @extend .red
      @extend .white--text
</style>
