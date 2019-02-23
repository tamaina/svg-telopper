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
    instance: {
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
  const renderInstanceId = request.body.option.instance.renderInstanceId || request.body.option.renderInstanceId
  const b = await db.renderInstances.findOne(
    { renderInstanceId }
  )
  if (!b) {
    server.message("指定された描画インスタンスは見つかりませんでした。", "error")
  }
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceUpdated",
      instance: await db.renderInstances.update(
        { renderInstanceId },
        extend(true, {}, b, request.body.option.instance),
        { returnUpdatedDocs: true }
      )
    }
  })

  return  { type: "success", success: "ok" }
}
