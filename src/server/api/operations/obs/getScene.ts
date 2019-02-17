import $ from "cafy"

import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "OBSのソース一覧から、ソースの設定を取得します。"
  },
  params: {
    names: {
      validator: $.arr($.str),
      description: {
        "ja-JP": "OBSのソース名を配列で指定します。"
      }
    }
  },
  res: {
    type: "object",
    props: {
      createdNote: {
        type: "sourceSettings[]",
        desc: {
          "ja-JP": "ソースの設定値(デフォルト値は含まない)"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  if (!server.obsInfo) return { type: "obsInfo", obsInfo: server.obsInfo }

  const sources = await Promise.all(
    request.body.names.map(
        sourceName => server.obs.send("GetSourceSettings", { sourceName })
      )
    ) as any[]

  return { type: "sourceSettings", sourceSettings: sources.map(source => source.sourceSettings) }
}
