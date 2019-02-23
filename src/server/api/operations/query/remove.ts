import $ from "cafy"

import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import db from "../../../db"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "プリセットをアップデートします。"
  },
  params: {
    ids: {
      validator: $.arr($.str),
      description: {
        "ja-JP": "クエリIDの配列です"
      }
    }
  },
  res: {
    type: "object",
    props: {
      success: {
        type: "success",
        desc: {
          "ja-JP": "成功"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  db.queries.remove(
    { _id: { $in: request.body.option.ids }}
  )
  server.broadcastData({
    type: "update",
    body: {
      type: "queriesRemoved",
      ids: request.body.option.ids
    }
  })
  db.renderInstances.update(
    { queries: { $exists: true }},
    { $pull: { queries: { $in: request.body.option.ids }}},
    { multi: true, returnUpdatedDocs: true }
  ).then(instances => {
    console.log(instances)
    if (!instances) return
    for (const instance of instances) {
      server.broadcastData({
        type: "update",
        body: {
          type: "renderInstanceUpdated",
          instance
        }
      })
    }
  })
  return  { type: "success", success: "ok" }
}
