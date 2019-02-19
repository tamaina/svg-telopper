<template lang="pug">
v-flex(xs6).query-editor
  v-card(v-if="editing && editing.length > 0").edit
    v-toolbar
      v-toolbar-title {{ presetName || (ids && ids.join(', ')) || $t("new-query") }}
    v-form
      v-container(grid-list-xs fluid)
        v-layout(row wrap)
          //- テキスト
          v-flex(xs12)
            v-layout(v-if="replace")
              v-flex(
                v-for="(part, i) in replace"
                :key="i"
              ).ma-1
                v-text-field(
                  v-model="replace[i]"
                  :label="$t('replacer-text')"
                  :placeholder="`${i + 1}`"
                  outline
                  :hide-details="true"
                )
            v-layout(v-if="text")
              v-flex(
                v-for="(part, i) in text"
                :key="i"
              ).ma-1
                v-text-field(
                  v-model="text[i]"
                  :label="$t('replacing-text')"
                  :placeholder="`${i + 1}`"
                  outline
                  :hide-details="true"
                )
            v-layout(v-if="replace")
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
            v-layout
              v-flex(xs6).ma-1
                v-select(
                  v-if="presetId !== null"
                  :items="$store.state.presets"
                  v-model="presetId"
                  item-text="presetName"
                  item-value="_id"
                )

              v-flex(xs6).ma-1
                v-text-field(
                  v-model="timeout"
                  :label="$t('timeout')"
                  outline
                  :hide-details="true"
                  :return-masked-value="true"
                  mask="##########"
                )

              v-flex(xs6).ma-1
                v-text-field(
                  v-model="classStr"
                  :label="$t('class')"
                  outline
                  :hide-details="true"
                )

              v-flex(xs6).ma-1
                v-flex()
                  v-select(
                    :items="['end', 'middle', 'start']"
                    v-model="anchor"
                    :hint="$t('align')"
                  )

            div(v-if="stretch === true || stretch === false")
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
            )
            monaco-editor(
              v-if="editableTexts && editingText"
              v-model="$data[editingText.key]"
              :language="editingText.language"
              theme="vs-dark"
            ).monaco

          //- save
          v-flex(xs12)
            v-layout(
              v-show="!isNewQuery"
            )
              v-flex
                v-btn(
                  block
                  color="info"
                  @click="save"
                ).ma-1
                  font-awesome-icon(icon="save" fixed-width)
                  | {{ $t("save") }}
                v-btn(
                  block
                  color="error"
                  @click="remove"
                ).ma-1
                  font-awesome-icon(icon="trash" fixed-width)
                  | {{ $t("remove") }}

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

  v-card(v-else)
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

const i18n = I18n("components/query-editor")

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
      anchor: null,
      tab: null,
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
      if (!this.$data.presetId) return null
      return this.$store.state.presets.find(e => e._id === this.$data.presetId)
    },
    editing() {
      return this.$store.state.editingQueries
    },
    isNewQuery() {
      return !(this.$data.ids && this.$data.ids.filter(e => e).length !== 0)
    }
  },
  mounted() {
  },
  methods: {
    pushTexts(ev: MouseEvent) {
      this.text ? this.text.push("") : this.text = [""]
      this.replace ? this.replace.push("") : this.replace = [""]
    },
    popTexts(ev: MouseEvent) {
      this.text && this.text.length > 0 ? this.text.pop() : this.text = []
      this.replace && this.replace.length > 0 ? this.replace.pop() : this.replace = []
    },
    save(ev: MouseEvent) {
      const query = {} as { [key: string]: any }
      const targetKeys = [
        "replace",
        "text",
        "innerHtml",
        "timeout",
        "class",
        "stretch",
        "func",
        "anchor"
      ]
      query.class = this.$data.class
      for (const key of targetKeys) {
        switch (key) {
          case "class":
            if (
              this.$data.classStr !== null &&
              this.preset ?
              this.preset.classStrthis.$data.classStr : true
            ) query.class = this.$data.classStr
          default:
            if (
              this.$data[key] !== null &&
              this.preset ?
              this.preset.classStrthis.$data[key] : true
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
    }
  },
  watch: {
    editing(newVal, oldVal) {/*
      if (newVal.length === 1 && newVal[0]._id === null) {

        return
      }*/
      const store = this.$store
      const queries = newVal.map(e => {
        return (store.state.presets
        .concat(store.state.queriesShowing))
        .find(x => x._id === e || x._edit_id === e)
      })
      console.log(newVal)
      console.log(queries)
      console.log(store.state.presets.concat(store.state.queriesShowing))
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
              qs.ids.push(query._edit_id)
              break
            case "replace":
              qs.replace.push(query.replace ? [].concat(query.replace) : null)
              break
            case "class":
              qs.classStr.push(query.class)
            case "text":
              qs.text.push((query.text || query.replace) ? [].concat(query.text || query.replace) : null)
              break
            default:
              qs[key].push(query[key])
          }
        }
      }
      //console.log(qs)
      for (const key in qs) {
        const filtered = qs[key].filter((e, i, self) => {
          if (e === undefined) return false
          return self.findIndex(x => equal(e, x, { strict: true })) === i
        })
        //console.log(filtered)
        if (key === "ids") {
          this.$data.ids = qs.ids
          continue
        }
        if (filtered.length > 1){
          this.$data[key] = null
        } else if (filtered.length === 1) {
          this.$data[key] = filtered[0]
        } else {
          this.$data[key] = null
        }
      }

      if (this.$data.text && this.$data.replace) {
        if (this.$data.text.length > this.$data.replace.length) this.$data.text.splice(0, this.$data.replace.length)
        else if (this.$data.text.length < this.$data.replace.length) {
          for (let i = 0; i < this.$data.replace.length - this.$data.text.length; i += 0) {
            this.$data.text.push(this.$data.replace[this.$data.text.length + i])
          }
        }
      }
      this.$data.editableTexts = []
      if (this.$data.innerHtml || this.$data.innerHtml === "") this.$data.editableTexts = this.$data.editableTexts.concat([
          {
            text: this.$t("html"),
            key: "innerHtml",
            language: "html"
          }
        ])
      if (this.$data.func || this.$data.func === "") this.$data.editableTexts = this.$data.editableTexts.concat([
          {
            text: this.$t("function"),
            key: "func",
            language: "javascript"
          }
        ])
      this.editingText = this.$data.editableTexts ? this.$data.editableTexts[0] : null
    },
    preset(newVal, oldVal) {
      if (newVal) {
        this.$data.replace = (this.$data.replace || newVal.replace || []).concat
        this.$data.text = (this.$data.text || newVal.text || this.$data.replace || newVal.replace || []).concat
        this.$data.innerHtml = this.$data.innerHtml || newVal.innerHtml || null
        this.$data.timeout = this.$data.timeout || newVal.timeout || null
        this.$data.classStr = this.$data.classStr || newVal.class || null
        this.$data.stretch = this.$data.stretch || newVal.stretch || false
        this.$data.func = this.$data.function || newVal.function || null
        this.$data.anchor = this.$data.anchor || newVal.anchor || null

        if (this.$data.text && this.$data.replace) {
          if (this.$data.text.length > this.$data.replace.length) this.$data.text.splice(0, this.$data.replace.length)
          else if (this.$data.text.length < this.$data.replace.length) {
            for (let i = 0; i < this.$data.replace.length - this.$data.text.length; i += 0) {
              this.$data.text.push(this.$data.replace[this.$data.text.length + i])
            }
          }
        }
        this.$data.editableTexts = []
        if (this.$data.innerHtml || this.$data.innerHtml === "") this.$data.editableTexts = this.$data.editableTexts.concat([
            {
              text: this.$t("html"),
              key: "innerHtml",
              language: "html"
            }
          ])
        if (this.$data.func || this.$data.func === "") this.$data.editableTexts = this.$data.editableTexts.concat([
            {
              text: this.$t("function"),
              key: "func",
              language: "javascript"
            }
          ])
        this.editingText = this.$data.editableTexts ? this.$data.editableTexts[0] : null
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
