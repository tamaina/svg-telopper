export interface ISocketData {
  type: "ping" |
        "request" |
        "response" |
        "renderInstanceInfo" |
        "obsRecievedData" |
        "obsRequestData" |
        "message" |
        "update"
  body: {
    [ key: string ]: any
    type: string
    t?: number
  },
  instance?: string
}

export interface ISocketBroadData extends ISocketData {
  type: "renderInstanceInfo" |
        "obsRecievedData" |
        "message" |
        "update"
  body: {
    [ key: string ]: any
    type: string
  }
}

export interface ISocketMessageData extends ISocketBroadData {
  type: "message"
  body: {
    type: "info" | "error" | "warn"
    comment: string
    data: any
  }
}

export interface ISocketRequestData extends ISocketData {
  type: "request" |
        "obsRequestData"
  body: {
    [ key: string ]: any
    type: string
  },
  instance: string
}

export interface ISocketResponseData extends ISocketData {
  type: "response"
  body: {
    [ key: string ]: any
    type: string
  }
  instance: string
}
