<template lang="pug">
v-flex(xs5).query-list
  v-toolbar
    v-toolbar-title {{ $t("@.words.query") }}
    v-spacer
    v-btn(icon)
      font-awesome-icon(icon="plus" @click="addNewQuery")
  v-card
    v-list
      v-list-tile(
        v-for="query in queries"
        :key="query._id"
        @click="listClicked"
        @clicl.ctrl="listClickedWCtrl"
        :data-query-id="query._id"
        v-bind:class="{ active: editingQueries.some(e => e === query._id) }"
      )
        v-list-tile-content
          v-list-tile-title.preview-select {{ query.presetName || query._id || $t("no-name") }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

import equal from "deep-equal"

const i18n = I18n("components/query-list")

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
    queries() {
      return this.$store.state.queriesShowing
    },
    editingQueries() {
      return this.$store.state.editingQueries
    }
  },
  mounted() {
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      this.$store.commit("set", { key: "editingQueries", value: [current.dataset.queryId] })
    },
    listClickedWCtrl(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      if (this.$store.state.editingQueries.some(e => e._id === current.dataset.queryId)) {
        this.$store.commit("remove", { key: "editingQueries", value: current.dataset.queryId })
      } else {
        this.$store.commit("push", { key: "editingQueries", value: current.dataset.queryId })
      }
    },
    addNewQuery(ev: MouseEvent) {
      const v = equal(this.$store.state.activeSources, [null]) ? {
          _id: null,
          presetId: null,
          presetName: null,
          text: [],
          innerHtml: "",
          replace: [],
          timeout: 0,
          class: '',
          stretch: '',
          func: '',
          anchor: 'middle'
        } :
        {}
      this.$store.commit("set", { key: "editingQueries", value: [v] })
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
