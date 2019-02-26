const gulp = require("gulp")
const webpackStream = require("webpack-stream")
const webpack = require("webpack")
const del = require("del")

const log = require("fancy-log")
const colors = require("colors")

const $ = require("gulp-load-plugins")()
const wpackconf = require("./webpack.config")

const pkg = require("./package.json")

gulp.task("webpack", (cb) => {
  webpackStream(wpackconf, webpack)
    .pipe(gulp.dest("./built/assets/"))
    .on("end", () => {
      log(colors.green("☑ Webpack Compile Completed"))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})

gulp.task("tsc", (cb) => {
  const tsProject = $.typescript.createProject("tsconfig.server.json")
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("./built"))
    .on("end", () => {
      log(colors.green("☑ TypeScript Compile Completed"))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})

gulp.task("locales", (cb) => {
  gulp.src("./locales/*.yaml")
    .pipe($.yaml({ schema: "DEFAULT_SAFE_SCHEMA" }))
    .pipe(gulp.dest("./built/assets/locales/"))
    .on("end", () => {
      log(colors.green("☑ Locale Files Converted"))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})

gulp.task("copy:files", (cb) => {
  gulp.src(["./src/**/*", "!**/*.ts", "!**/*.vue", "!**/*.js"])
    .pipe(gulp.dest("./built/"))
    .on("end", () => {
      log(colors.green("☑ Assets Copied"))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})

gulp.task("clean:built", () => del(["built/**/*"], { dot: true }))

gulp.task("default",
  gulp.series(
    "clean:built",
    gulp.parallel(
      "tsc",
      "webpack",
      "copy:files",
      "locales"
    ),
    (cb) => { cb() }
  ))

gulp.task("zip", (cb) => {
  gulp.src([
    "*.md",
    "LICENSE",
    "package.json",
    "package-lock.json",
    ".config.yaml",
    "*.bat",
    "salt.js",
    "views/**/*",
    "datastore/db/data/queries.nedb",
    "locales/**/*",
    "built/**/*"
  ], { base: "." })
    .pipe($.zip(`svg-telopper-v${pkg.version}.zip`))
    .pipe(gulp.dest("zips"))
    .on("end", () => {
      log(colors.green(`☑ zipped (svg-telopper-v${pkg.version}.zip)`))
      cb()
    })
    .on("error", (err) => {
      cb(err)
    })
})
