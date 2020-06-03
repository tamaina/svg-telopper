<template lang="pug">
v-flex(xs2).source-list.h-100
  v-card.st-column
    v-toolbar
      v-toolbar-title {{ $t("@.obs.source") }}
    v-list
      v-list-tile(
        @click="presetClicked"
        :data-source-name="false"
        v-bind:class="{ 'active red white--text': $store.state.selectedRenderInstances.some(e => e === null) }"
      ).preset
        v-list-tile-content
          v-list-tile-title.preview-select {{ $t("@.words.preset") }}
      template(v-if="!isAll")
        source-list-item(
          v-for="source in sourceList"
          :source="source"
          :key="source.name"
        )
      template(v-else)
        source-list-item-render-instance(
          v-for="renderInstance in $store.state.renderInstances"
          :renderInstance="renderInstance"
          :key="renderInstance.renderInstanceId"
        )
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"
import sourceListItem from "./source-list-item.vue"
import sourceListItemRenderInstance from "./source-list-item-render-instance.vue"

import equal from "deep-equal"

const i18n = I18n("components/source-list")

export default Vue.extend({
  components: {
    sourceListItem,
    sourceListItemRenderInstance
  },
  data() {
    return {
      sourceList: [],
      selectedPreset: true
    }
  },
  computed: {
    activeScenes() {
      return this.$store.state.activeScenes
    },
    isAll() {
      return this.$store.state.activeScenes?.length === 1 && this.$store.state.activeScenes[0] === null
    }
  },
  mounted() {
  },
  methods: {
    presetClicked(ev: MouseEvent) {
      this.$store.commit("set", { key: "activeSources", value: [null] })
      this.$store.commit("set", { key: "selectedRenderInstances", value: [null] })
    },
  },
  watch: {
    activeScenes(newVal, oldVal) {
      if (newVal?.length === 1 && newVal[0] === null) {
        return this.$data.sourceList = []
      }
      this.$root.socket.operate("obs/getSceneTree", {
          sceneNames: newVal,
          andOr: this.$store.state.sceneMultipleAndOr
        })
        .then(res => {
          if (res.type === "sourceSettings") this.$data.sourceList = res.sourcesTree
        })
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
</style>
