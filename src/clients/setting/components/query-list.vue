<template lang="pug">
v-flex(grow).query-list
  v-card.column
    v-toolbar
      v-toolbar-title {{ $t("@.words.query") }}
      v-spacer
      v-btn(icon v-show="$store.state.activeSources.length === 1" @click="addNewQuery")
        font-awesome-icon(icon="plus")
    v-list(v-if="queries.length > 0")
      v-list-tile(
        v-for="query in queries"
        :key="query._id || query._edit_id"
        @click.exact="listClicked"
        @clicl.ctrl="listClickedWCtrl"
        :data-query-id="query._id || query._edit_id"
        v-bind:class="{ 'active purple white--text': editingQueries.some(e => e === query._id || e === query._edit_id) }"
      )
        v-list-tile-content
          v-list-tile-title.preview-select {{ query.presetName || query._id ? `#${query._id}` : query._edit_id ? $t("new-query") : $t("no-name") }}
    .empty.py-5.px-3.text-xs-center(v-else-if="this") {{ $t("empty") }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n"

import equal from "deep-equal"
import { getUniqueStr } from "../../scripts/getUniqueStr";

const i18n = I18n("components/query-list")

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
    selectedRenderInstances() {
      return this.$store.state.selectedRenderInstances
    },
    queries() {
      if (!this.$store.state.selectedRenderInstances || equal(this.$store.state.selectedRenderInstances, [null])) return this.$store.state.presets
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
      if (equal(this.$store.state.selectedRenderInstances, [null], { strict: true })) {
      const _edit_id = `__EDIT__${getUniqueStr()}`
      this.$store.commit("push", { key: "presets", value: {
          _edit_id,
          presetId: null,
          presetName: "",
          text: [""],
          innerHtml: "",
          replace: [""],
          timeout: 0,
          class: "",
          stretch: false,
          func: "",
          anchor: "middle"
        }})
      this.$store.commit("set", { key: "editingQueries", value: [_edit_id] })
      } else {
        if (this.$store.state.presets.length === 0) {
          alert(this.$t("you-should-have-one-or-more-presets"))
          return
        }
        const presetId = this.$store.state.presets[0]._id
        this.$root.$data.socket.operate("query/create", { query: { presetId } })
          .then(data => {
            for (const id of this.$store.state.selectedRenderInstances) {
              const renderInstance = this.$store.state.renderInstances.find(e => e.renderInstanceId === id)
              this.$root.$data.socket.operate("renderInstance/update", {
                renderInstanceId: id,
                options: { queries: renderInstance.options.queries.concat([data._id]) }
              })
            }
            this.$store.commit("push", { key: "queriesShowing", value: { _id: data._id, presetId }})
            this.$store.commit("set", { key: "editingQueries", value: [ data._id ] })
          })
      }
    }
  },
  watch: {
    selectedRenderInstances(newVal, oldVal) {
      if (newVal === null || newVal === undefined || newVal.length === 0) {
        this.$store.commit("set", { key: "queriesShowing", value: [] })
        return
      }
      if (!newVal || equal(newVal, [null], { strict: true })) {
        return
      }
      const flatten = xs => xs.reduce((d, e) => Array.isArray(e) ?
                                                [...d, ...flatten(e)] :
                                                [...d, e ], [])
      const qs = newVal.filter((e, i, arr) => arr.indexOf(e) === i)
                       .map(e => this.$store.state.renderInstances.find(x => x.renderInstanceId === e))
                       .filter(e => e)
                       .map(e => e.options.queries)
      /*const qz = this.$store.state.renderInstances.filter(e => newVal.some(x => x === e.renderInstanceId))
                                                  .map(e => e.options.queries)
                                                  .filter((e, i, arr) => arr.indexOf(e) === i)*/
      this.$root.$data.socket.operate("query/list", { ids: flatten(qs) })
        .then(data => this.$store.commit("set", { key: "queriesShowing", value: data.queries }))
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
.query-list
  flex-grow: 1
</style>
