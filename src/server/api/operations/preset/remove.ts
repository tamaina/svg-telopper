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
    presetId: {
      validator: $.str,
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
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  db.presets.remove(
    { _id: request.body.presetId }
  )
  server.broadcastData({
    type: "update",
    body: {
      type: "presetRemoved",
      presetId: request.body.presetId
    }
  })

  return  { type: "success", success: "ok" }
}
