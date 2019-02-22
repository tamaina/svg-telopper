import $ from "cafy"
import * as extend from "extend"

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
  if (!b) {
    server.message("指定された描画インスタンスは見つかりませんでした。", "error")
  }
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceUpdated",
      query: await db.renderInstances.update(
        { renderInstanceId: request.body.option.renderInstanceId },
        { $set: { options: extend(true, {}, b.options, request.body.option.options) } },
        { returnUpdatedDocs: true }
      )
    }
  })

  return  { type: "success", success: "ok" }
}
