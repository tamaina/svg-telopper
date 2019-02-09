const gulp = require("gulp")
const webpackStream = require("webpack-stream")
const webpack = require("webpack")
const glog = require("fancy-log")
const readyaml = require("js-yaml").safeLoad
const fs = require("fs")
const colors = require("colors")
function loadyaml(filepath) {
  return readyaml(fs.readFileSync(filepath))
}
const setting = loadyaml("setting.yaml")

const $ = require("gulp-load-plugins")()

gulp.task("js", (cb) => {
  const wpackconf = {
    entry: ["./ts/main.ts"],
    output: {
      filename: "main.js",
      publicPath: `js/`
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      modules: ["node_modules"]
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    },
    mode: "production"
  }

  webpackStream(wpackconf, webpack)
    .pipe(gulp.dest(`js`))
    .on("end", () => {
      glog(colors.green("✔ main.js"))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})

gulp.task("watch", () => {
  gulp.watch(["**/*.ts"], gulp.series("js", (cb) => { cb() }))
})

gulp.task("connect", () => {
  $.connect.server({
    port: "8000",
    root: ".",
    livereload: true
  })
})

gulp.task("local-server",
gulp.series(
  gulp.parallel("connect", "watch"),
  (cb) => { cb() }
))
