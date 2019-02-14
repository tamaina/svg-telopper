import { ISocketData, ISocketDataRegisterRenderInstance } from "../../models/socketData"
import { getUniqueStr } from "../../scripts/components/getUniqueStr"
import onReady from "../../scripts/components/onReady"
import { newSocket, pass } from "../../scripts/components/socket"
import { STW } from "../../scripts/components/stw"

const init = () => {
  const socket = newSocket()

  const renderInstanceId = location.hash.length > 1 ? location.hash.slice(1) : getUniqueStr()

  location.hash = `#${renderInstanceId}`

  new STW(document.body, renderInstanceId, socket)

  const rootRect = document.body.getBoundingClientRect()

  socket.addEventListener("open", ev => {
    pass({
      body: {
        height: rootRect.height,
        renderInstanceId,
        width: rootRect.width
      } as ISocketDataRegisterRenderInstance,
      type: "registerRenderInstance"
    } as ISocketData, socket)
  })

  document.title = `SVG Telopper!: render#${renderInstanceId}`
}
onReady(init)
