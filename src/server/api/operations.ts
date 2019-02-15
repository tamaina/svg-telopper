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
}

interface IEndpoint {
  name: string
  exec: (server: STServer, request: ISocketRequestData) => Promise<{ [ key: string ]: any }>
  info: IEndpointInfo
}

const files = glob.sync("**/*.js", {
  cwd: resolve(`${__dirname}/endpoints/`)
})

const endpoints: IEndpoint[] = files.map(f => {
  const ep = require(`./endpoints/${f}`)

  return {
    exec: ep.default as (server: STServer, request: ISocketRequestData) => Promise<{ [ key: string ]: any }>,
    meta: ep.meta || {},
    name: f.replace(".js", "")
  }
})

export default endpoints
