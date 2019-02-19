import $ from "cafy"

import { STServer } from "../../.."
import { ISocketRequestData } from "../../../../models/socketData"
import db from "../../../db"
import { IEndpointInfo } from "../../operations"

export const meta = {
  description: {
    "ja-JP": "OBSのシーン設定を取得します。"
  },
  params: {
    sceneNames: {
      validator: $.arr($.str),
      description: {
        "ja-JP": "OBSのシーン名を配列で指定します。"
      }
    },
    andOr: {
      validator: $.optional.str.or(["and", "or"]),
      description: {
        "ja-JP": "`and`または`or`を指定します。sceneNamesで指定したシーンを検索するとき、「かつ」「もしくは」のどちらににするか指定できます。"
      }
    }
  },
  res: {
    type: "object",
    props: {
      createdNote: {
        type: "sourceSettings[]",
        desc: {
          "ja-JP": "ソースの設定値(デフォルト値は含まない)"
        }
      }
    }
  }
} as IEndpointInfo

export default async (server: STServer, request: ISocketRequestData) => {
  if (!server.obsInfo) {
    server.message("OBSに未接続です。", "error")
    return { type: "success", success: "ng" }
  }

  const trueScenes = request.body.option.sceneNames.filter(e => e && server.obsInfo.scenes.some(e))

  if (request.body.option.sceneNames.length - trueScenes > 1) server.message("不明なシーンが見つかりました。", "warn")

  const [sources, sceneList] = await Promise.all([(() => {
    switch (request.body.option.andOr) {
    case "and":
      return db.obsSources.find({
        // tslint:disable-next-line: only-arrow-functions
        $and: trueScenes.map(function(e: string) { return { scenes: e }})
      }) as Promise<any[]>
    case "or":
      return db.obsSources.find({ scenes: { $in: trueScenes } }) as Promise<any[]>
    }
  })(), server.obs.send("GetSceneList")])

  const sourcesTree = await Promise.all(sources.map(async e => {
    return {
      name: e.name,
      type: e.type,
      sourceSettings: await server.obs.send("GetSourceSettings", { sourceName: e.name })
                             .then(data => data.sourceSettings),
      children: e.children.length > 0
        ? await Promise.all(e.children.map(
            n => server.obs.send("GetSourceSettings", { sourceName: n })
          )).then(settings => {
            return settings.map((s: any) => { return {
              name: s.sourceName,
              type: s.sourceType,
              sourceSettings: s.sourceSettings
            }})
          })
        : null
    }
  }))

  if (trueScenes.length === 1) {
    const sceneSources = sceneList.scenes.find(e => e.name === trueScenes[0]).sources
    sourcesTree.sort(
      (a, b) => (sceneSources.findIndex(e => e.name === a.name) || 0)
                - (sceneSources.findIndex(e => e.name === b.name) || 0)
    )
  }

  return { type: "sourceSettings", sourcesTree }
}
