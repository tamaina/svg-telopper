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
  if (await db.presets.findOne({ renderInstanceId: request.body.renderInstanceId }).connectionCount > 0) {
    return { type: "success", success: "ng" }
  }

  db.presets.remove(
    { renderInstanceId: request.body.renderInstanceId }
  )
  server.broadcastData({
    type: "update",
    body: {
      type: "renderInstanceRemoved",
      renderInstanceId: request.body.renderInstanceId
    }
  })

  return  { type: "success", success: "ok" }
}
