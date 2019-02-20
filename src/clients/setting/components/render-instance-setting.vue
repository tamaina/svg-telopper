<template lang="pug">
v-flex(shrink v-if="instance").render-instance-setting
  v-card.column
    v-toolbar
      v-toolbar-title #{`#`}{{ renderInstanceId }}
    v-container(grid-list-xs fluid)
      v-layout(column wrap)
        v-switch(
          v-model="reverse"
          :label="$t('reverse')"
        )
        v-select(
          :items="queries"
          v-model="queryId"
          item-text="_id"
          item-value="_id"
          :hint="$t('show')"
          persistent-hint
          outline
        )

</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

const i18n = I18n("components/render-instance-setting")

export default Vue.extend({
  components: {
  },
  props: {
  },
  data() {
    return {
      queryId: null,
      reverse: null,
      renderInstanceId: null
    }
  },
  computed: {
    instance() {
      return this.$store.state.selectedRenderInstances.length === 1 && this.$store.state.selectedRenderInstances[0] !== 0? 
               this.$store.state.selectedRenderInstances[0] :
               null
    },
    queries() {
      return this.$store.state.queriesShowing
    }
  },
  mounted() {
  },
  methods: {
  },
  watch: {
    instance(newVal, oldVal) {
      if (!newVal) return
      this.$data.queryId = this.$store.state.queriesShowing[newVal.options.showingIndex]._id
      this.$data.reverse = newVal.options.reverse
      this.$data.renderInstanceId = newVal.renderInstanceId
    },
    queryId(newVal, oldVal) {
      this.$root.$data.socket.pass({
        type: "renderInstanceInfo",
        body: {
          type: "showRenderInstanceSubtitle",
          renderInstanceId: this.$data.renderInstanceId,
          target: this.$store.state.queriesShowing.findIndex(e => e._id === newVal)
        }
      })
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
</style>
