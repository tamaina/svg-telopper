<template lang="pug">
  v-toolbar(dark color="primary")
    v-toolbar-title(class="white--text") {{ title }}
</template>
<script lang="ts">
import Vue from "vue"
import { I18n } from "../i18n";

const i18n = I18n("components/navbar")

export default Vue.extend({
  props: ["title"],
  i18n
})
</script>
