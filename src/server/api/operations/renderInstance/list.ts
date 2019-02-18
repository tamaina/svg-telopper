import $ from "cafy"

import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import db from "../../../db"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "描画インスタンス一覧を返します。"
  },
  params: {
    ids: {
      validator: $.optional.arr($.str),
      description: {
        "ja-JP": "取得したい描画インスタンスのIdを配列で指定します。"
      }
    }
  },
  res: {
    type: "object",
    props: {
      renderInstances: {
        type: "renderInstance[]",
        desc: {
          "ja-JP": "描画インスタンス"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  return {
    type: "renderInstancesList",
    renderInstances: request.body.ids && meta.params.ids.validator.ok(request.body.ids)
                      ? await db.renderInstances.find({ renderInstanceId: { $in: request.body.ids } })
                      : await db.renderInstances.find({})
  }
}
