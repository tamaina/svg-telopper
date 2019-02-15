type F = () => any

export default (f: F, options?: boolean | AddEventListenerOptions) => {
  document.readyState === "loading" ?
    document.addEventListener("DOMContentLoaded", f, options) :
    f()
}
