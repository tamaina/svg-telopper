import { Context } from "cafy"
import * as glob from "glob"
import { resolve } from "path"
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

interface IEndpoint {
  name: string
  exec: (request: ISocketRequestData) => Promise<{ [ key: string ]: any }>
  info: IEndpointInfo
}

const files = glob.sync("**/*.js", {
  cwd: resolve(`${__dirname}/operations/`)
})

const endpoints: IEndpoint[] = files.map(f => {
  const ep = require(`./operations/${f}`)

  return {
    exec: ep.default as (request: ISocketRequestData) => Promise<{ [ key: string ]: any }>,
    meta: ep.meta || {},
    name: f.replace(".js", "")
  }
})

export default endpoints
