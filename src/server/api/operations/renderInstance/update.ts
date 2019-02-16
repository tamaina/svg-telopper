import $ from "cafy"

import { server } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import db from "../../../db"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "プリセットをアップデートします。"
  },
  params: {
    renderInstanceId: {
      validator: $.str,
      description: {
        "ja-JP": "renderInstanceId"
      }
    },
    options: {
      validator: $.obj(),
      description: {
        "ja-JP": "ISTWOptions"
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

export default async (request: ISocketRequestData) => {
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceUpdated",
      query: await db.presets.update(
        { _id: request.body.query._id },
        { $set: request.body.query },
        { returnUpdatedDocs: true }
      )
    }
  })

  return  { type: "success", success: "ok" }
}
