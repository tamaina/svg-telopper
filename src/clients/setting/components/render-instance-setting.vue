<template lang="pug">
v-flex(shrink v-if="instance").render-instance-setting
  v-card.column
    v-toolbar
      v-toolbar-title #{`#`}{{ renderInstanceId }}
    v-container(grid-list-xs fluid)
      v-layout(column wrap)
        .pa-1.w-100
          v-select(
            :items="queries"
            v-model="queryId"
            item-text="_id"
            item-value="_id"
            :label="$t('show')"
            outline
            :hide-details="true"
          ).query-select
        hr
        .px-1.py-3
          v-switch(
            v-model="reverse"
            :label="$t('reverse')"
            :hide-details="true"
          ).ma-0.pa-0
        v-layout.w-100
          v-flex.pa-1
            v-text-field(
              v-model="width"
              :label="$t('client-width')"
              :placeholder="$t('css-value')"
              outline
              :hide-details="true"
            )
          v-flex.pa-1
            v-text-field(
              v-model="height"
              :label="$t('client-height')"
              :placeholder="$t('css-value')"
              outline
              :hide-details="true"
            )
        .pa-1
          v-btn(
            block
            color="info"
            @click="apply"
          )
            font-awesome-icon(icon="check" fixed-width)
            | {{ $t("apply") }}

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
      showingIndex: 0,
      reverse: null,
      renderInstanceId: null,
      width: null,
      height: null
    }
  },
  computed: {
    instance() {
      return this.$store.state.selectedRenderInstances.length === 1 && this.$store.state.selectedRenderInstances[0] !== null ? 
               this.$store.state.renderInstances.find(e => e.renderInstanceId === this.$store.state.selectedRenderInstances[0]) :
               null
    },
    queries() {
      return this.$store.state.queriesShowing
    }
  },
  mounted() {
  },
  methods: {
    apply() {
      this.$root.$data.socket.operate("renderInstance/update", {
        renderInstanceId: this.$data.renderInstanceId,
        options: {
          clientWidth: this.$data.width,
          clientHeight: this.$data.height,
          reverse: this.$data.reverse
        }
      })
    }
  },
  watch: {
    async instance(newVal, oldVal) {
      if (!newVal || this.$store.state.queriesShowing.length === 0) {
        this.$data.queryId = null
        return
      }
      console.log(newVal)
      this.$data.showingIndex = newVal.options.showingIndex % this.$store.state.queriesShowing.length || 0
      await this.$nextTick()
      const n = this.$store.state.queriesShowing[this.$data.showingIndex]
      if (!n) return
      this.$data.queryId = n._id
      this.$data.reverse = newVal.options.reverse
      this.$data.width = newVal.options.clientWidth
      this.$data.height = newVal.options.clientHeight
      this.$data.renderInstanceId = newVal.renderInstanceId
    },
    queries(newVal, oldVal) {
      console.log(newVal)
      console.log(this.$data.showingIndex)
      if (!newVal || newVal.length === 0) return
      this.$data.queryId = newVal[this.$data.showingIndex % newVal.length]._id
    },
    queryId(newVal, oldVal) {
      console.log(this.$store.state.queriesShowing)
      if (!oldVal) return
      const target = this.$store.state.queriesShowing.findIndex(e => e._id === newVal)
      this.$data.showingIndex = target
      this.$root.$data.socket.pass({
        type: "renderInstanceInfo",
        body: {
          type: "showRenderInstanceSubtitle",
          renderInstanceId: this.$data.renderInstanceId,
          target
        }
      })
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
hr
  border: none
  background-color: #282828
  margin-top: .75em
  height: 1px
.query-select
  overflow: hidden
.w-100
  width: 100%
</style>
