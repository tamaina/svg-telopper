<template lang="pug">
v-flex(xs6).query-editor
  v-toolbar
    v-toolbar-title {{ editing && editing.length > 0 ? presetName || (ids && ids.join(', ')) || $t("new-query") : $t("nothing") }}
  v-card(v-if="editing && editing.length > 0").edit
    v-form.pa-2
      v-select(
        v-if="presetId"
        :items="$store.presets"
        v-model="presetId"
        item-text="presetName"
        item-value="_id"
      )
      v-layout(v-if="replace")
        v-flex(
          v-for="(part, i) in replace"
          :key="i"
        ).ma-1
          v-text-field(v-model="replace[i]" :label="`${$t('replacer-text')} ${i + 1}`" outline :hide-details="true")
      v-layout(v-if="text")
        v-flex(
          v-for="(part, i) in text"
          :key="i"
        ).ma-1
          v-text-field(v-model="text[i]" :label="`${$t('replacing-text')} ${i + 1}`" outline :hide-details="true")
      v-layout
        v-flex
          v-btn(block color="error" @click="pushTexts")
            font-awesome-icon(icon="plus")
        v-flex
          v-btn(block color="info" @click="popTexts")
            font-awesome-icon(icon="minus")
      v-tabs(dark)
        v-tab(v-for="n in 2" :key="i")
        v-tab-item
          monaco-editor(
            v-model="func"
            language="javascript"
          ).monaco
        v-tab-item
          monaco-editor(
            v-model="innerHtml"
            language="html"
          ).monaco

      v-flex()
        v-select(
          :items="['end', 'middle', 'start']"
          v-model="anchor"
        )

      div
        v-btn(
          block
          color="error"
          @click="save"
        ) {{ $t("save") }}
        v-layout
          v-text-field(v-model="presetName" :label="$t('save-preset')" :placeholder="$t('preset-name')" outline :hide-details="true")
          v-btn(
            block
            color="warning"
            @click="savePreset"
          ) {{ $t("save-preset") }}
  v-card(v-else).empty
    .empty {{ $t("empty") }}
</template>
<script lang="ts">
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
      class: null,
      stretch: null,
      func: null,
      anchor: null
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
    }
  },
  mounted() {
  },
  methods: {
    pushTexts(ev: MouseEvent) {
      this.text ? this.text.push("") : this.text = []
      this.replace ? this.replace.push("") : this.replace = []
    },
    popTexts(ev: MouseEvent) {
      this.text && this.text.length > 0 ? this.text.pop() : this.text = []
      this.replace && this.replace.length > 0 ? this.replace.pop() : this.replace = []
    },
    save(ev: MouseEvent) {
      const newQuery = {} as { [key: string]: any }
      if (this.$data.presetName !== (this.editing.presetName || this.preset.presetName || null)) {
        newQuery.presetName = this.$data.presetName
      }
    },
    savePreset(ev: MouseEvent) {
      const newQuery = {} as { [key: string]: any }
      if (this.$data.presetName !== (this.editing.presetName || this.preset.presetName || null)) {
        newQuery.presetName = this.$data.presetName
      }
    }
  },
  watch: {
    editing(newVal, oldVal) {
      if (newVal) {
        const qs = {
          ids: [],
          presetId: [],
          presetName: [],
          replace: [],
          text: [],
          innerHtml: [],
          timeout: [],
          class: [],
          stretch: [],
          func: [],
          anchor: []
        }
        if (newVal) {
          for (const query of newVal) {
            for (const key in qs) {
              switch (key) {
                case "ids":
                  qs.ids.push(query._id)
                  break
                case "replace":
                  qs.replace.push(query.replace ? query.replace.concat() : null)
                  break
                case "text":
                  qs.text.push((query.text || query.replace) ? (query.text || query.replace).concat() : null)
                  break
                default:
                  qs[key].push(query[key])
              }
              qs[key].push(query[key])
            }
          }
        }
        console.log(qs)
        for (const key in qs) {
          const filtered = qs[key].filter((e, i, self) => e && self.indexOf(e) === i)
          if (qs[key].length > 1){
            this.$data[key] = null
          } else if (qs[key].length === 0) {
            this.$data[key] = qs[key][0]
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
      }
    },
    preset(newVal, oldVal) {
      if (newVal) {
        this.$data.id = this.$data.editing._id || null
        this.$data.presetName = this.$data.editing.presetName || null
        this.$data.replace = (this.$data.editing.replace || newVal.replace || []).concat
        this.$data.text = (this.$data.editing.text || newVal.text || this.$data.editing.replace || newVal.replace || []).concat
        this.$data.innerHtml = this.$data.editing.innerHtml || newVal.innerHtml || null
        this.$data.timeout = this.$data.editing.timeout || newVal.timeout || null
        this.$data.class = this.$data.editing.class || newVal.class || null
        this.$data.stretch = this.$data.editing.stretch || newVal.stretch || false
        this.$data.func = this.$data.editing.function || newVal.function || null
        this.$data.anchor = this.$data.editing.anchor || newVal.anchor || null

        if (this.$data.text && this.$data.replace) {
          if (this.$data.text.length > this.$data.replace.length) this.$data.text.splice(0, this.$data.replace.length)
          else if (this.$data.text.length < this.$data.replace.length) {
            for (let i = 0; i < this.$data.replace.length - this.$data.text.length; i += 0) {
              this.$data.text.push(this.$data.replace[this.$data.text.length + i])
            }
          }
        }
      }
    }
  },
  i18n
})
</script>
<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '~vuetify/src/stylus/generic/_colors.styl'
.query-editor
  .edit
    .monaco
      height: 500px
      width: 100%
</style>
