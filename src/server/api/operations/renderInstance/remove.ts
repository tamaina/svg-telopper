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
  if (await db.renderInstances.findOne(
    {renderInstanceId: request.body.option.renderInstanceId }).connectionCount > 0) {
    return { type: "success", success: "ng" }
  }

  db.renderInstances.remove(
    { renderInstanceId: request.body.option.renderInstanceId }
  )
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceRemoved",
      renderInstanceId: request.body.option.renderInstanceId
    }
  })

  return  { type: "success", success: "ok" }
}
