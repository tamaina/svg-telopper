import colors from "vuetify/es5/util/colors"

import {
  VApp,
  VBtn,
  VCard,
  VContainer,
  VContent,
  VFlex,
  VForm,
  VInput,
  VLayout,
  VList,
  VListTile,
  VListTileSubTitle,
  VListTileTitle,
  VRadio,
  VRadioGroup,
  VSwitch,
  VTab,
  VTabItem,
  VTabs,
  VToolbar,
  VToolbarTitle
} from "vuetify/lib/components"

import { Ripple } from "vuetify/lib/directives"

export default {
  iconfont: "faSvg",
  components: {
    VApp,
    VBtn,
    VCard,
    VContainer,
    VContent,
    VFlex,
    VForm,
    VInput,
    VLayout,
    VList,
    VListTile,
    VListTileSubTitle,
    VListTileTitle,
    VRadio,
    VRadioGroup,
    VSwitch,
    VTab,
    VTabItem,
    VTabs,
    VToolbar,
    VToolbarTitle
  },
  directives: {
    Ripple
  },
  theme: {
    primary: colors.green
  }
}
