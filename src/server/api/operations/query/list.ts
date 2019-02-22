import $ from "cafy"

import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import db from "../../../db"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "プリセット一覧を返します。"
  },
  params: {
    ids: {
      validator: $.optional.arr($.str),
      description: {
        "ja-JP": "取得したいプリセットのidを配列で指定します。"
      }
    },
    isPreset: {
      validator: $.optional.bool,
      description: {
        "ja-JP": "真偽値で、プリセットかどうかを指定します。。"
      }
    }
  },
  res: {
    type: "object",
    props: {
      presets: {
        type: "preset[]",
        desc: {
          "ja-JP": "プリセット"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  const dbqs = []
  if ($.bool.ok(request.body.option.isPreset)) {
    if (request.body.option.isPreset === true) {
      dbqs.push({ $where() {
        return this.presetName !== null && this.presetName !== undefined
      } })
    } else {
      dbqs.push({ $where() {
        return this.presetName === null || this.presetName === undefined
      } })
    }
  }

  return {
    type: "queriesList",
    ids: request.body.option.ids,
    isPreset: request.body.option.isPreset,
    queries: request.body.option.ids ?
             dbqs.length > 0 ?
               await Promise.all(
                 request.body.option.ids.map(id => db.queries.findOne({ $and: dbqs.concat([{ _id: id }]) }))
               ) :
               await Promise.all(
                 request.body.option.ids.map(id => db.queries.findOne({ _id: id }))
               ) :
             dbqs.length > 0 ?
               await db.queries.find({ $and: dbqs }) : await db.queries.find({})
  }
}
