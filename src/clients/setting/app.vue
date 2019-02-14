<template lang="pug">
.ss-app
  nav {{ $t("@.obs.sceneCollection") }}
  div {{ $t("@.obs.scene") }}
  div {{ $t("@.renderInstance") }}
</template>

<script lang="ts">
import Vue from "vue"
import { I18n } from "./i18n";

const i18n = I18n("app")

export default Vue.extend({
  i18n
})
</script>

<style lang="sass">
.ss-app
  background-color: rgba(0, 0, 0, .1)
</style>
