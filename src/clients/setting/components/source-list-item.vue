<template lang="pug">
v-list-tile(
  v-if="relatedRenderInstance"
  :data-render-instance-id="relatedRenderInstance.renderInstanceId"
  @click="renderInstanceClicked"
  :class="{ active }"
).source.source-text
  v-list-tile-content
    v-list-tile-title {{ source.name }}
v-list-tile(
  v-else-if="source.type === 'group'"
  :class="{ active }"
)
  v-list-tile-content
    v-list-tile-title {{ source.name }}
    v-list
      source-list-item(
        v-for="source in source.children"
        :source="source"
        :active="activeItems.some(e => e === scene)"
        :key="source.name"
        :activeItems="activeItems"
      )
v-list-tile(
  v-else
  :class="{ active }"
).source.source-others
  v-list-tile-content
    v-list-tile-title {{ source.name }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n";

const i18n = I18n("components/source-list")

export default Vue.extend({
  name: "source-list-item",
  props: {
    source: Object,
    _active: Boolean,
    _activeItems: Array
  },
  data() {
    return {
      active: this.$props._active,
      activeItems: this.$props._activeItems
    }
  },
  computed: {
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
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      this.$data.activeItems = [this.$props.source.name]
    },
    listClickedWCtrl(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetSourceName = this.$data.source.name
      if (this.$data.activeItems.some(e => e === this.$data.source.name)) {
        this.$data.activeItems = this.$data.activeItems.filter(e => e !== targetSourceName)
      } else {
        this.$data.activeItems = this.$data.activeItems.push(targetSourceName)
      }
    },
  },
  watch: {
    active(newVal, oldVal) {
      if (!newVal) return
      this.socket.request({
        type: "query/list",
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
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '~vuetify/src/stylus/generic/_colors.styl'
.source-wrapper
  .source
    &.actice
      @extend .purple
      @extend .white--text
</style>
