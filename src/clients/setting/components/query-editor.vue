<template lang="pug">
v-flex(xs5).query-editor.h-100
  v-card(v-if="editing && editing.length > 0").edit.st-column
    v-toolbar
      v-toolbar-title {{ presetName ? `${presetName}${ids ? ` (#${ids.join(', #')})` : ''}` : `#${ids && ids.join(', #')}` || $t("new-query") }}
    v-form
      v-container(grid-list-xs fluid)
        v-layout(row wrap)
          //- テキスト
          v-flex(xs12)
            v-layout(v-if="replace")
              v-flex(
                v-for="(part, i) in replace"
                :key="`${i}${ids.join('.')}`"
              ).pa-1
                v-text-field(
                  v-model="replace[i]"
                  :label="$t('replacer-text')"
                  :placeholder="`${i + 1}`"
                  outline
                  :hide-details="true"
                )
            v-layout()
              v-flex(
                v-for="(part, i) in text"
                :key="`${i}${ids.join('.')}`"
              ).pa-1
                v-text-field(
                  v-model="text[i]"
                  :label="$t('replacing-text')"
                  :placeholder="`${i + 1}`"
                  outline
                  :hide-details="true"
                )
            v-layout()
              v-flex(xs6).px-1
                v-btn(block color="error" @click="pushTexts")
                  font-awesome-icon(icon="plus" fixed-width)
                  | {{ $t("push-text") }}
              v-flex(xs6).px-1
                v-btn(block color="info" @click="popTexts")
                  font-awesome-icon(icon="minus" fixed-width)
                  | {{ $t("pop-text") }}
          //- others
          v-flex(xs12)
            v-layout(row wrap)
              v-flex(xs4 v-if="presetId !== null").pa-1
                v-select(
                  :items="$store.state.presets"
                  v-model="presetId"
                  item-text="presetName"
                  item-value="_id"
                  :label="$t('preset')"
                  outline
                  :hide-details="true"
                )

              v-flex(xs4).pa-1
                v-text-field(
                  v-model="timeout"
                  :label="$t('timeout')"
                  outline
                  :hide-details="true"
                  :return-masked-value="true"
                  mask="##########"
                )

              v-flex(xs4).pa-1
                v-text-field(
                  v-model="classStr"
                  :label="$t('class')"
                  outline
                  :hide-details="true"
                )

              v-flex(xs4).pa-1
                v-select(
                  :items="['end', 'middle', 'start']"
                  v-model="anchor"
                  :label="$t('anchor')"
                  outline
                  :hide-details="true"
                )

          v-flex(xs12 v-if="stretch === true || stretch === false")
            v-switch(
              v-model="stretch"
              :label="$t('stretch')"
            )

          //- monaco
          v-flex(xs12)
            v-select(
              v-if="editableTexts"
              :items="editableTexts"
              v-model="editingText"
              item-text="text"
              item-value="key"
              return-object
              :label="$t('editor')"
              outline
              :hide-details="true"
            )
            monaco-editor(
              v-if="editableTexts && editingText"
              v-model="$data[editingText.key]"
              :language="editingText.language"
              theme="vs-dark"
            ).monaco

          //- save
          v-flex(xs12)
            v-layout
              v-flex(v-if="!editId").pa-1
                v-btn(
                  block
                  color="info"
                  @click="save"
                )
                  font-awesome-icon(icon="save" fixed-width)
                  | {{ $t("save") }}
              v-flex(v-if="!editId").pa-1
                v-btn(
                  block
                  color="error"
                  @click="remove"
                )
                  font-awesome-icon(icon="trash" fixed-width)
                  | {{ $t("remove") }}
              v-flex(v-if="!editId").pa-1
                v-menu(offset-y)
                  v-btn(
                    block
                    color="primary"
                    slot="activator"
                  )
                    font-awesome-icon(icon="copy" fixed-width)
                    | {{ $t("add-to-render-instance") }}
                  v-list
                    v-list-tile(
                      v-for="instance of $store.state.renderInstances"
                      :key="instance.renderInstanceId"
                      @click="addToInstance(instance)"
                    )
                      v-list-tile-title {{ instance.renderInstanceId }}
              v-flex(v-if="editId").pa-1
                v-btn(
                  block
                  color="error"
                  @click="cancel"
                )
                  font-awesome-icon(icon="times" fixed-width)
                  | {{ $t("cancel") }}

            v-text-field(
              v-model="presetName"
              :label="$t('preset-name')"
              outline
              :hide-details="true"
            ).ma-1

            v-btn(
              block
              color="warning"
              @click="savePreset"
            ).ma-1 {{ $t("save-preset") }}

  v-card(v-else).st-column
    v-toolbar
      v-toolbar-title {{ $t("nothing") }}
    .empty.py-5.px-3.text-xs-center {{ $t("empty") }}
</template>
<script lang="ts">
import $ from "cafy"
import Vue from "vue"
import { I18n } from "../i18n"

import MonacoEditor from "vue-monaco"

import equal from "deep-equal"
import { getUniqueStr } from "../../../getUniqueStr"

const i18n = I18n("components/query-editor")

const renew = (component: Vue, mpreset?: any) => {
  const editing = component.$store.state.editingQueries
  const res = {
      ids: null,
      presetId: null,
      presetName: null,
      text: null,
      innerHtml: null,
      replace: null,
      timeout: null,
      classStr: null,
      stretch: null,
      func: null,
      style: null,
      anchor: null,
      tab: null,
      editingText: null,
      editableTexts: [],
      editId: null,
      presetq: null
    }
  const store = component.$store
  const queries = editing.map(e => {
    return (store.state.presets
    .concat(store.state.queriesShowing))
    .find(x => x._id === e || x._edit_id === e)
  })
  if (!$.arr($.obj()).min(0).ok(queries)) return
  const qs = {
    ids: [],
    presetId: [],
    presetName: [],
    replace: [],
    text: [],
    innerHtml: [],
    timeout: [],
    classStr: [],
    stretch: [],
    func: [],
    style: [],
    anchor: [],
    editId: []
  }
  for (const query of queries) {
    for (const key in qs) {
      switch (key) {
        case "ids":
          qs.ids.push(query._id)
          break
        case "editId":
          qs.editId.push(query._edit_id)
          break
        case "replace":
        case "text":
          qs[key].push(query[key] ? [].concat(query[key]) : undefined)
          break
        case "classStr":
          qs.classStr.push(query.class)
          break
        default:
          qs[key].push(query[key])
      }
    }
  }
  let filtered = {} as { [key: string]: any }

  for (const key in qs) {
    filtered[key] = qs[key].filter((e, i, self) => {
      if (e === undefined) return false
      return self.findIndex(x => equal(e, x, { strict: true })) === i
    })
  }

  if (!mpreset) {
    if (filtered.presetId.length === 1) {
      res.presetId = filtered.presetId[0]
    } else {
      res.presetId = null
    }
  } else {
    res.presetId = mpreset._id
  }

  let preset = mpreset || (res.presetId ? component.$store.state.presets.find(e => e._id === filtered.presetId[0]) : null)
  res.presetq = preset
  if (preset) preset = Object.assign({}, preset)

  for (const key in qs) {
    switch (key) {
    case "ids":
      res.ids = qs.ids.filter(e => e)
      break
    case "presetId":
      break
    case "text":
      if (filtered.text.length === 1) {
        res.text = [].concat(filtered.text[0])
        break
      }
      res.text = preset ? preset.text ? [].concat(preset.text) : ([].concat(preset.replace) || [""]) : [""]
      break
    case "replace":
      if (filtered.replace.length === 1) {
        res.replace = [].concat(filtered.replace[0])
        break
      }
      res.replace = preset ? [].concat(preset.replace) : [""]
      break
    case "presetName":
      if (filtered.presetName.length === 1) {
        res.presetName = filtered.presetName[0]
        break
      }
      res.presetName = null
      break
    default:
      if (filtered[key].length === 1) {
        res[key] = filtered[key][0]
        break
      }
      res[key] = preset ? preset[key] : key === "stretch" ? false : null
    }
  }

  if (res.text.length > res.replace.length) res.text.splice(0, res.replace.length)
  else if (res.text.length < res.replace.length) {
    for (let i = 0; i < res.replace.length - res.text.length; i += 0) {
      res.text.push(res.replace[res.text.length + i])
    }
  }

  res.editableTexts = []
  if (res.innerHtml || res.innerHtml === "") res.editableTexts.push(
      { text: component.$t("html"), key: "innerHtml", language: "html" }
    )
  if (res.func || res.func === "") res.editableTexts.push(
      { text: component.$t("function"), key: "func", language: "javascript" }
    )
  if (res.style || res.style === "") res.editableTexts.push(
      { text: component.$t("style"), key: "style", language: "css" }
    )
  res.editingText = res.editableTexts ? res.editableTexts[0] : null

  return res
}

export default Vue.extend({
  name: "source-list-item",
  props: {
  },
  data() {
    return {
      ids: null,
      presetId: null,
      presetName: null,
      text: null,
      innerHtml: null,
      replace: null,
      timeout: null,
      classStr: null,
      stretch: null,
      func: null,
      style: null,
      anchor: null,
      editingText: null,
      editableTexts: [],
      editId: null
    }
  },
  components: {
    MonacoEditor
  },
  computed: {
    preset() {
      return this.$data.presetId ? this.$store.state.presets.find(e => e._id === this.$data.presetId) : null
    },
    editing() {
      return this.$store.state.editingQueries
    }
  },
  mounted() {
  },
  methods: {
    pushTexts(ev: MouseEvent) {
      this.$data.text ? this.$data.text.push("") : this.$data.text = [""]
      this.$data.replace ? this.$data.replace.push("") : this.$data.replace = [""]
    },
    popTexts(ev: MouseEvent) {
      this.$data.text && this.$data.text.length > 0 ? this.$data.text.pop() : this.$data.text = []
      this.$data.replace && this.$data.replace.length > 0 ? this.$data.replace.pop() : this.$data.replace = []
    },
    save(ev: MouseEvent) {
      const query = {} as { [key: string]: any }
      const targetKeys = [
        "presetName",
        "presetId",
        "replace",
        "text",
        "innerHtml",
        "timeout",
        "class",
        "stretch",
        "func",
        "style",
        "anchor"
      ]
      query.class = this.$data.class
      for (const key of targetKeys) {
        switch (key) {
        case "class":
          if (
            this.$data.classStr !== null && (
              this.$data.presetq ?
              (this.$data.classStr !== this.$data.presetq.class) :
              true )
          ) query.class = this.$data.classStr
          break
        case "presetId":
        case "presetName":
          if (this.$data[key] !== null) query[key] = this.$data[key]
          break
        default:
          if (
            this.$data[key] !== null && (
              this.$data.presetq ?
              !equal(this.$data[key], this.$data.presetq[key], { strict: true }) :
              true )
          ) query[key] = this.$data[key]
        }
      }
      const vdata = this.$data
      for (const _id of this.$data.ids) {
        this.$root.$data.socket.operate("query/update", {
          query: Object.assign({ _id }, query)
        })
          .then(data => {
            if (data.type !== "success") return
          })
      }
      if (this.$data.editId) {
        this.$store.commit("remove", { key: "editingQueries", value: this.$data.editId })
        this.$store.commit("removeByKeyTest", { key: "presets", testKey: "_edit_id", testValue: this.$data.editId })
        this.$data.editId = null
      }
    },
    cancel(ev: MouseEvent) {
      this.$store.commit("remove", { key: "editingQueries", value: this.$data.editId })
      this.$store.commit("removeByKeyTest", { key: "presets", testKey: "_edit_id", testValue: this.$data.editId })
      this.$data.editId = null
    },
    savePreset(ev: MouseEvent) {
      if (!this.$data.presetName) alert(this.$t("you-should-fill-in-preset-name"))
      const query = {
        presetName: null,
        replace: [],
        text: [],
        innerHtml: '',
        timeout: 0,
        class: '',
        stretch: false,
        func: '',
        style: '',
        anchor: 'middle'
      }
      for (const key in query) {
        switch (key) {
          case "class":
            if (this.$data.classStr !== null) query.class = this.$data.classStr
          default:
            if (this.$data[key] !== null) query[key] = this.$data[key]
        }
      }
      const vdata = this.$data
      this.$root.$data.socket.operate("query/create", { query })
        .then(data => {
          if (data.type !== "success") return
          vdata.ids = [data._id]
        })
      if (this.$data.editId) {
        this.$store.commit("remove", { key: "editingQueries", value: this.$data.editId })
        this.$store.commit("removeByKeyTest", { key: "presets", testKey: "_edit_id", testValue: this.$data.editId })
        this.$data.editId = null
      }
    },
    remove() {
      this.$root.$data.socket.operate("query/remove", { ids: this.$data.ids })
      this.$store.commit("set", { key: "editingQueries", value: [] })
    },
    addToInstance(instance) {
      const query = {} as { [key: string]: any }
      const targetKeys = [
        "replace",
        "text",
        "innerHtml",
        "timeout",
        "class",
        "stretch",
        "func",
        "style",
        "anchor"
      ]
      query.class = this.$data.class
      for (const key of targetKeys) {
        switch (key) {
        case "class":
          if (
            this.$data.classStr !== null && (
              !this.$data.presetName ?
              (this.$data.classStr !== this.$data.presetq.class) :
              true )
          ) query.class = this.$data.classStr
          break
        default:
          if (
            this.$data[key] !== null && (
              !this.$data.presetName ?
              !equal(this.$data[key], this.$data.presetq[key], { strict: true }) :
              true )
          ) query[key] = this.$data[key]
        }
      }
      if (this.$data.presetName) query.presetId = this.$data.ids[0]
      if (this.$data.presetId) query.presetId = this.$data.presetId
      const vdata = this.$data
      this.$root.$data.socket.operate("query/create", {
        query
      })
        .then(data => {
          if (data.type !== "success") return
          this.$root.$data.socket.operate("renderInstance/update", {
            instance: {
              renderInstanceId: instance.renderInstanceId,
              queries: instance.queries.concat([data._id])
            }
          })
          this.$store.commit("set", { key: "editingQueries", value: [data._id] })
        })
    }
  },
  watch: {
    editing(newVal, oldVal) {
      const res = renew(this)
      for (const key in res) {
        this.$data[key] = res[key]
      }
    },
    preset(newVal, oldVal) {
      const res = renew(this, newVal)
      for (const key in res) {
        this.$data[key] = res[key]
      }
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
.query-editor
  .edit
    .monaco
      min-height: 30em
      height: 100%
      width: 100%
</style>
