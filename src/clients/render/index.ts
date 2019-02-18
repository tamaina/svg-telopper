import { ISocketData } from "../../models/socketData"
import { getUniqueStr } from "../scripts/getUniqueStr"
import onReady from "../scripts/onReady"
import { Socket } from "../scripts/socket"
import { STW } from "../scripts/stw"

const init = () => {
  const socket = new Socket()

  const renderInstanceId = location.hash.length > 1 ? decodeURI(location.hash.slice(1)) : getUniqueStr()

  location.hash = `#${renderInstanceId}`

  new STW(document.body, renderInstanceId, socket)

  const rootRect = document.body.getBoundingClientRect()

  socket.socket.addEventListener("open", ev => {
    socket.pass({
      body: {
        height: rootRect.height,
        renderInstanceId,
        type: "registerRenderInstance",
        width: rootRect.width
      },
      type: "renderInstanceInfo"
    })
  })

  document.title = `SVG Telopper!: render#${renderInstanceId}`
}
onReady(init)
