<template lang="pug">
v-flex(grow shrink).query-list.overflow-auto.h-100.pb-0
  v-card.st-column
    v-toolbar
      v-toolbar-title {{ $t("@.words.query") }}
      v-spacer
      v-btn(icon v-show="oneInstanceSelected" @click="addNewQuery")
        font-awesome-icon(icon="plus")
    v-list(v-if="queries.length > 0")
      draggable(v-model="queries" draggable=".draggable" @choose="draggableItemClicked" @sort="dragged")
        v-list-tile(
          v-for="(query, i) in queries"
          :key="query._id || query._edit_id"
          @click.exact="listClicked"
          @click.ctrl="listClickedWCtrl"
          :data-query-id="query._id || query._edit_id"
          v-bind:class="{ 'active purple white--text': editingQueries.some(e => e === query._id || e === query._edit_id), 'draggable': oneInstanceSelected }"
        )
          v-list-tile-content
            v-list-tile-title.preview-select {{ query.presetName ? query.presetName : query._id ? `#${query._id}` : query._edit_id ? $t("new-query") : $t("no-name") }}
            v-list-tile-sub-title {{ query.presetName ? ( query.replace ? query.replace.join("/") : '' ) : ( query.text ? query.text.join("/") : "" ) }}
    .empty.py-5.px-3.text-xs-center(v-else) {{ $t("empty") }}
</template>
<script lang="ts">
import $ from "cafy"
import Vue from "vue"
import draggable from 'vuedraggable'
import { I18n } from "../i18n"

import equal from "deep-equal"
import { getUniqueStr } from "../../../getUniqueStr"


const i18n = I18n("components/query-list")

const renew = (component: Vue) => {
  if (component.$data.selectedRenderInstances === null || component.$data.selectedRenderInstances === undefined || component.$data.selectedRenderInstances.length === 0) {
    component.$store.commit("set", { key: "queriesShowing", value: [] })
    component.$data.queries = []
    return
  }
  if (!component.$data.selectedRenderInstances || equal(component.$data.selectedRenderInstances, [null], { strict: true })) {
    component.$store.commit("set", { key: "queriesShowing", value: component.$store.state.presets })
    component.$data.queries = component.$store.state.presets
    return
  }
  const flatten = xs => xs.reduce((d, e) => Array.isArray(e) ? [...d, ...flatten(e)] : [...d, e], [])
  const qs = component.$data.selectedRenderInstances.filter(e => e)
                   .map(e => e.queries)
  return component.$root.$data.socket.operate("query/list", { ids: flatten(qs) })
    .then(data => {
        const queries = data.queries.filter(e => e)
        component.$store.commit("set", { key: "queriesShowing", value: queries})
        component.$data.queries = queries
        return
      })
}

export default Vue.extend({
  components: {
    draggable
  },
  data() {
    return {
      queries: [],
      selectedRenderInstances: null,
      draggable: false
    }
  },
  computed: {
    xselectedRenderInstances() {
      const si = this.$store.state.selectedRenderInstances.map(
          e => {
            if (!e) return null
            return this.$store.state.renderInstances.find(x => x.renderInstanceId === e)
          }
        )
      this.$data.selectedRenderInstances = si
      return si
    },
    editingQueries() {
      return this.$store.state.editingQueries
    },
    oneInstanceSelected() {
      const res = (this.$store.state.selectedRenderInstances).length === 1
      this.$data.draggable = res
      return res
    }
  },
  mounted() {
    this.$root.$data.socket.socket.addEventListener("message", ev => {
      if (!$.str.ok(ev.data)) return
      const data = JSON.parse(ev.data)
      if (data.body.type === "queryUpdated") {
        renew(this)
      }
    })
    this.$store.watch(state => state.presets, () => {
      renew(this)
    })
  },
  methods: {
    listClicked(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      const targetId = current.dataset.queryId
      if (
        targetId &&
        current.classList.contains("active") &&
        this.$data.selectedRenderInstances &&
        this.$data.selectedRenderInstances.length === 1 &&
        this.$data.selectedRenderInstances[0]) {
        this.$root.$data.socket.pass({
          type: "renderInstanceInfo",
          body: {
            type: "showRenderInstanceSubtitle",
            renderInstanceId: this.$data.selectedRenderInstances[0].renderInstanceId,
            targetId
          }
        })
        return
      }
      this.$store.commit("set", { key: "editingQueries", value: [targetId] })
    },
    listClickedWCtrl(ev: MouseEvent) {
      const current = (ev.currentTarget || ev.target) as HTMLElement
      if (this.$store.state.editingQueries.some(e => e === current.dataset.queryId)) {
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
          style: "",
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
                instance: { queries: renderInstance.queries.concat([data._id]) }
              })
            }
            this.$store.commit("push", { key: "queriesShowing", value: { _id: data._id, presetId }})
            this.$store.commit("set", { key: "editingQueries", value: [ data._id ] })
          })
      }
    },
    draggableItemClicked(ev: any) {
      const current = (ev.item as HTMLElement).children.item(0) as HTMLElement
      const targetId = current.dataset.queryId
      if (
        targetId &&
        current.parentElement.classList.contains("active") &&
        this.$data.selectedRenderInstances &&
        this.$data.selectedRenderInstances.length === 1 &&
        this.$data.selectedRenderInstances[0]) {
        this.$root.$data.socket.pass({
          type: "renderInstanceInfo",
          body: {
            type: "showRenderInstanceSubtitle",
            renderInstanceId: this.$data.selectedRenderInstances[0].renderInstanceId,
            targetId
          }
        })
        return
      }
      this.$store.commit("set", { key: "editingQueries", value: [targetId] })
    },
    dragged(ev: any) {
      if (
        this.$data.selectedRenderInstances &&
        this.$data.selectedRenderInstances.length === 1 &&
        this.$data.selectedRenderInstances[0] !== null) {
        this.$root.$data.socket.operate("renderInstance/update", {
          renderInstanceId: this.$data.selectedRenderInstances[0].renderInstanceId,
          instance: { queries: this.$data.queries.map(e => e._id) }
        })
      }
    }
  },
  watch: {
    xselectedRenderInstances(newVal, oldVal) {
      if (equal(newVal, oldVal)) return
      renew(this)
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
.query-list
  flex-grow: 1
</style>
