<template lang="pug">
v-flex(xs5).query-list
  v-toolbar
    v-toolbar-title {{ $t("@.words.query") }}
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
          v-list-tile-title.preview-select {{ scene }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

const i18n = I18n("components/source-list")

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
    queries() {
      return this.$store.queriesShowing
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
      if (this.$store.editingQueries.some(e => e === current.dataset.queryId)) {
        this.$store.commit("remove", { key: "editingQueries", value: current.dataset.queryId })
      } else {
        this.$store.commit("push", { key: "editingQueries", value: current.dataset.queryId })
      }
    },
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
