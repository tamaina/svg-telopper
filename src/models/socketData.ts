export interface ISocketData {
  type: "ping" |
        "request" |
        "response" |
        "renderInstanceInfo" |
        "obsRecievedData" |
        "obsRequestData"
  body: {
    [ key: string ]: any
    type: string
    t?: number
  }
}

export interface ISocketBroadData extends ISocketData {
  type: "renderInstanceInfo" |
        "obsRecievedData"
  body: {
    [ key: string ]: any
    type: string
  }
}

export interface ISocketRequestData extends ISocketData {
  type: "request" |
        "obsRequestData"
  body: {
    [ key: string ]: any
    type: string
    instance: string
  }
}

export interface ISocketResponseData extends ISocketData {
  type: "response"
  body: {
    [ key: string ]: any
    type: string
    instance: string
  }
}
