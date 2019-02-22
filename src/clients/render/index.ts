import { getUniqueStr } from "../scripts/getUniqueStr"
import onReady from "../scripts/onReady"
import { Socket } from "../scripts/socket"
import { STW } from "../scripts/stw"

declare global {
// tslint:disable-next-line: interface-name
  interface Window {
    stw: STW
  }
}

const init = () => {
  const socket = new Socket()

  const renderInstanceId = location.hash.length > 1 ? decodeURI(location.hash.slice(1)) : getUniqueStr()

  location.hash = `#${renderInstanceId}`

  window.stw = new STW(document.body, renderInstanceId, socket)

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
