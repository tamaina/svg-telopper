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

export default async (server: STServer, request: ISocketRequestData) => {
  const b = await db.renderInstances.findOne(
    { renderInstanceId: request.body.option.renderInstanceId }
  )
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceUpdated",
      query: await db.renderInstances.update(
        { renderInstanceId: request.body.option.renderInstanceId },
        { $set: { options: Object.assign(b.options, request.body.option.options) } },
        { returnUpdatedDocs: true }
      )
    }
  })

  return  { type: "success", success: "ok" }
}
