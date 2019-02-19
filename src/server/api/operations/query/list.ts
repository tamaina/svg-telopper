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
  if (request.body.option.ids) {
    dbqs.push({ _id: { $in: request.body.option.ids } })
  }
  if ($.bool.ok(request.body.option.isPreset)) dbqs.push({ presetName: { $exists: request.body.option.isPreset } })

  return {
    type: "queriesList",
    ids: request.body.option.ids,
    isPreset: request.body.option.isPreset,
    queries: dbqs.length > 0 ? await db.queries.find({$and: dbqs}) : await db.queries.find({})
  }
}
