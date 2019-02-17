import colors from "vuetify/es5/util/colors"

import {
  VApp,
  VCard,
  VFlex,
  VLayout,
  VList,
  VListTile,
  VListTileSubTitle,
  VListTileTitle,
  VRadio,
  VRadioGroup,
  VToolbar,
  VToolbarTitle
} from "vuetify/lib/components"

import { Ripple } from "vuetify/lib/directives"

export default {
  iconfont: "faSvg",
  components: {
    VApp,
    VCard,
    VFlex,
    VLayout,
    VList,
    VListTile,
    VListTileSubTitle,
    VListTileTitle,
    VRadio,
    VRadioGroup,
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
