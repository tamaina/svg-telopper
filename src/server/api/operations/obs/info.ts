import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "OBS"
  },
  params: {}
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => Object.assign(
    { type: "obsDataFullChanged" }, server.obsInfo || { null: null }
  )
