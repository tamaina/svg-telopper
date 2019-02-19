<template lang="pug">
source-list-item-render-instance(
  v-if="relatedRenderInstance"
  :renderInstance="relatedRenderInstance"
  @click.exact="listClicked"
  @click.ctrl="listClickedWCtrl"
).source.source-text
v-list-tile(
  v-else-if="source.type === 'group'"
  :class="{ 'active red white--text': active }"
  @click.exact="listClicked"
  @click.ctrl="listClickedWCtrl"
)
  v-list-tile-content
    v-list-tile-title {{ source.name }}
    v-list
      source-list-item(
        v-for="source in source.children"
        :source="source"
        :key="source.name"
      )
v-list-tile(
  v-else
  :class="{ 'active red white--text': active }"
  @click.exact="listClicked"
  @click.ctrl="listClickedWCtrl"
).source.source-others
  v-list-tile-content
    v-list-tile-title {{ source.name }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"
import sourceListItemRenderInstance from "./source-list-item-render-instance.vue"

const i18n = I18n("components/source-list")

export default Vue.extend({
  name: "source-list-item",
  components: {
    sourceListItemRenderInstance
  },
  props: {
    source: Object
  },
  data() {
    return {
    }
  },
  computed: {
    active() {
      return this.$store.state.activeSources.some(e => e === this.$props.source.name)
    },
    relatedRenderInstance() {
      if (this.source.type === "browser_source"
        && this.source.sourceSettings.url
        && this.source.sourceSettings.url.startsWith(`${location.origin}/settings#`)
      ) {
        const url = new URL(this.source.sourceSettings.url)
        if (url.hash.length > 1) {
          return this.$store.state.renderInstances.find(e => e.renderInstanceId ===  url.hash.slice(1))
        } else return false
      } else {
        return false
      }
    }
  },
  mounted() {
    console.log(this.source)
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      this.$store.commit("set", { key: "activeSources", value: [this.$props.source.name]})
    },
    listClickedWCtrl(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      if (this.$store.state.activeSources.some(e => e === this.$props.source.name)) {
        this.$store.commit("remove", { key: "activeSources", value: this.$props.source.name})
      } else {
        this.$store.commit("push", { key: "activeSources", value: this.$props.source.name})
      }
    }
  },
  watch: {
    active(newVal, oldVal) {
      if (!newVal) return
      this.$root.socket.operate("query/list", {
        ids: this.relatedRenderInstance.queries
      }).then(data => {
        this.$store.commit("set", { key: "queriesShowing", val: data.queries })
      })
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
</style>
