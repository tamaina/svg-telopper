const { join } = require("path")
const VueLoaderPlugin = require("vue-loader/lib/plugin")
const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin")
const MonocoEditorPlugin = require("monaco-editor-webpack-plugin")

module.exports = {
  entry: {
    render: "./src/clients/render/index.ts",
    setting: "./src/clients/setting/index.ts",
    "setting-boot": "./src/clients/setting/boot.ts"
  },
  output: {
    filename: "[name].js",
    path: join(__dirname, "built/assets"),
    publicPath: "/assets/"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".vue", ".vuex", ".styl"],
    modules: ["node_modules"],
    alias: {
      vue: "vue/dist/vue.js"
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
          configFile: "tsconfig.webpack.json"
        }
      },
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /^\?vue/,
            use: ["pug-plain-loader"]
          },
          {
            use: ["raw-loader", "pug-plain-loader"]
          }
        ]
      },
      {
        test: /\.sass$/,
        use: [
          "vue-style-loader",
          "css-loader",
          "postcss-loader",
          {
            loader: "sass-loader",
            options: {
              indentedSyntax: true
            }
          }
        ]
      },
      {
        test: /\.styl(us)?$/,
        use: [
          "vue-style-loader",
          "style-loader",
          "css-loader",
          "stylus-loader"
        ]
      },
      {
        test: /\.css$/,
        use: [
          "vue-style-loader",
          {
            loader: "css-loader"
          },
          "postcss-loader"
        ]
      },
      {
        test: /\.ttf$/,
        use: ['file-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new VuetifyLoaderPlugin(),
    new MonocoEditorPlugin({
      // https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      // Include a subset of languages support
      // Some language extensions like typescript are so huge that may impact build performance
      // e.g. Build full languages support with webpack 4.0 takes over 80 seconds
      // Languages are loaded on demand at runtime
      languages: ["javascript", "css", "html"]
    })
  ],
  mode: "production"
}
