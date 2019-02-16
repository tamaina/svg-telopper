import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "OBSの現在の状況を返答します。"
  },
  params: {},
  res: {
    type: "object",
    props: {
      obsInfo: {
        type: "IObsInfo",
        desc: {
          "ja-JP": "IObsInfo"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  return  { type: "obsInfo", obsInfo: server.obsInfo}
}
