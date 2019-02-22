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
/*
return {
  type: "queriesList",
  ids: request.body.option.ids,
  isPreset: request.body.option.isPreset,
  queries: dbqs.length > 0 ?
             request.body.option.ids ?
                await Promise.all(
                    request.body.option.ids.map(id => db.queries.find({ $and: dbqs.concat([ { _id: id } ]) }))
                  ) :
                await db.queries.find({$and: dbqs}) :
              await db.queries.find({})
}*/
export default async (server: STServer, request: ISocketRequestData) => {
  return {
    type: "renderInstancesList",
    renderInstances: request.body.option.ids && meta.params.ids.validator.ok(request.body.option.ids)
                      ? await Promise.all(
                        request.body.option.ids.map(renderInstanceId => db.queries.findOne({renderInstanceId}))
                      ) : await db.renderInstances.find({})
  }
}
