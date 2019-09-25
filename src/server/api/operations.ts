import { Context } from "cafy"
import * as glob from "glob"
import { resolve } from "path"
import { STServer } from ".."
import { ISocketRequestData } from "../../models/socketData"

export interface IEndpointInfo {
  description: { [key: string]: string }

  params: {
    [key: string]: {
      validator?: Context<any>
      description?: { [key: string]: string }
      default?: any
      ref?: string
    }
  }

  res: any
}

export type operater = (server: STServer, request: ISocketRequestData) => Promise<{ [ key: string ]: any }>

interface IEndpoint {
  name: string
  exec: operater
  info: IEndpointInfo
}

const files = glob.sync("**/*.js", {
  cwd: resolve(`${__dirname}/operations/`)
})

const endpoints: IEndpoint[] = files.map(f => {
  const ep = require(`./operations/${f}`)

  return {
    name: f.replace(".js", ""),
    exec: ep.default as operater,
    info: ep.meta || {}
  }
})

export default endpoints
