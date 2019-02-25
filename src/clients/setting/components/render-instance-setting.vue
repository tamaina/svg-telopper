<template lang="pug">
v-flex(shrink v-if="instances").render-instance-setting.overflow-auto
  v-card.st-column
    v-toolbar
      v-toolbar-title #{`#`}{{ renderInstanceIds.join(", #") }}
    v-container(grid-list-xs fluid)
      v-layout(column wrap)
        .pa-1.w-100(v-if="instances.length === 1")
          v-select(
            :items="queries"
            v-model="queryId"
            item-text="_id"
            item-value="_id"
            :label="$t('show')"
            outline
            :hide-details="true"
          ).query-select
        hr(v-if="instances.length === 1")
        .px-1.py-3
          v-switch(
            v-model="reverse"
            :label="$t('reverse')"
            :hide-details="true"
          ).ma-0.pa-0
        v-layout.w-100
          v-flex.pa-1
            v-text-field(
              v-model="clientWidth"
              :label="$t('client-width')"
              :placeholder="$t('css-value')"
              outline
              :hide-details="true"
            )
          v-flex.pa-1
            v-text-field(
              v-model="clientHeight"
              :label="$t('client-height')"
              :placeholder="$t('css-value')"
              outline
              :hide-details="true"
            )
        v-layout
          v-flex.pa-1
            v-btn(
              block
              color="info"
              @click="apply"
            )
              font-awesome-icon(icon="check" fixed-width)
              | {{ $t("apply") }}
          v-flex.pa-1
            v-btn(
              block
              color="error"
              @click="remove"
            )
              font-awesome-icon(icon="check" fixed-width)
              | {{ $t("remove") }}

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
      renderInstanceIds: [],
      clientWidth: null,
      clientHeight: null
    }
  },
  computed: {
    instances() {
      
      const filtered = this.$store.state.selectedRenderInstances.filter(e => e)
      return filtered.length > 0 ? 
               filtered.map(e => this.$store.state.renderInstances.find(x => x.renderInstanceId === e)).filter(e => e) :
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
      for (const id of this.$data.renderInstanceIds) {
        this.$root.$data.socket.operate("renderInstance/update", {
          renderInstanceId: id,
          instance: {
            clientWidth: this.$data.clientWidth,
            clientHeight: this.$data.clientHeight,
            reverse: this.$data.reverse
          }
        })
      }
    },
    remove() {
      this.$root.$data.socket.operate("renderInstance/remove", { ids: this.$data.renderInstanceIds })
      this.$store.commit("set", { key: "selectedRenderInstances", value: [] })
    }
  },
  watch: {
    async instances(newVal, oldVal) {
      this.$data.instancesChanged = true
      await this.$nextTick()
      if (!newVal || this.$store.state.queriesShowing.length === 0) {
        this.$data.queryId = null
        return
      }
      const l = newVal.length === 1
      this.$data.queryId = l ? newVal[0].showingQueryId : null
      for (const key of ["reverse", "clientWidth", "clientHeight"]) {
        const r = newVal.map(e => e[key]).filter(e => e)
        console.log(key, r)
        this.$data[key] = r.length !== 1 ? r[0] : null
      }
      this.$data.renderInstanceIds = newVal.map(e => e.renderInstanceId)
    },
    async queryId(newVal, oldVal) {
      if (!newVal) return
      await this.$nextTick()
      this.$root.$data.socket.pass({
        type: "renderInstanceInfo",
        body: {
          type: "showRenderInstanceSubtitle",
          renderInstanceId: this.$data.renderInstanceIds[0],
          targetId: newVal
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
