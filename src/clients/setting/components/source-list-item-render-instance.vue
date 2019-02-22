<template lang="pug">
  v-list-tile(
    @click.exact="renderInstanceClicked"
    @click.ctrl="renderInstanceClickedWCtrl"
    :class="{ 'active red white--text': active }"
  )
    v-list-tile-content
      v-list-tile-title #{'#'}{{ renderInstance.renderInstanceId }} ({{ renderInstance.connectionCount }})
</template>

<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n";

const i18n = I18n("components/source-list")

export default Vue.extend({
  props: {
    renderInstance: Object
  },
  data() {
    return {
    }
  },
  computed: {
    active() {
      return this.$store.state.selectedRenderInstances.some(e => e === this.$props.renderInstance.renderInstanceId)
    }
  },
  mounted() {
  },
  methods: {
    renderInstanceClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      this.$store.commit("set", { key: "selectedRenderInstances", value: [this.$props.renderInstance.renderInstanceId]})
    },
    renderInstanceClickedWCtrl(ev: MouseEvent) {
      if (this.$store.state.selectedRenderInstances.some(e => e === this.$props.renderInstance.renderInstanceId)) {
        this.$store.commit("remove", { key: "selectedRenderInstances", value: this.$props.renderInstance.renderInstanceId})
      } else {
        this.$store.commit("push", { key: "selectedRenderInstances", value: this.$props.renderInstance.renderInstanceId})
      }
    }
  },
  watch: {
  },
  i18n
})
</script>
<style lang="stylus" scoped>
</style>
