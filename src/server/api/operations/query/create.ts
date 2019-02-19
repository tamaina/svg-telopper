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
    query: {
      validator: $.obj(),
      description: {
        "ja-JP": "プリセットクエリ"
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
      },
      _id: {
        type: "_id",
        desc: {
          "ja-JP": "データベースのID"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  const inserted = await db.queries.insert(
    request.body.option.query
  )

  server.broadcastData({
    type: "update",
    body: {
      type: "queryCreated",
      query: inserted
    }
  })

  return  { type: "success", success: "ok", _id: inserted._id }
}
