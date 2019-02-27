# SVG Telopper
[使用方法などはこちらのページへ](https://tamaina.github.io/products/svg-telopper/v2.0/)

# 使い方 (かんたんに)
サーバーの起動には[**node.js**](https://nodejs.org/ja/)の事前のインストールが必要です(当方ではバージョン11で動作確認しています)。

また、[OBS WebSocket](https://github.com/Palakis/obs-websocket/releases/tag/4.4.0)をインストールすることで、OBSとのちょっとした連携を行うことができます。

## ダウンロード
[リリースページ](https://github.com/tamaina/svg-telopper/releases)から「svg-telopper-v2.x.x.zip」をダウンロードし、適当なフォルダに解凍してください。

## 基本操作
### 1. インストール
`install.bat`を実行(Windows向け)

**`install.bat`はバージョンアップ後も必ず実行してください。**

### 2. サーバーを開始
`Svg-Telopper.bat`を実行(Windows向け)

### 3-1. 設定画面にアクセスする
http://localhost:4044/setting にブラウザでアクセス

### 3-2. 描画インスタンスにアクセスする
`localhost:4044/render#<id>`にブラウザでアクセス

`<id>`は適当なIDで、設定画面で利用します。

初期設定では、`localhost:4044/render#hoge`, `localhost:4044/render#fuga`にアクセスすると色々見られます。

指定しなければ適当な数字が割り当てられ、ブラウザでアクセスすると自動的にURLが変更されますが、**OBSでは自動変更されたURLは保存されないので手動で設定する必要があります。**

## スクリーンショット
![image](https://user-images.githubusercontent.com/7973572/53215085-71918c80-3692-11e9-8b21-64c95441897c.png)  
![image](https://user-images.githubusercontent.com/7973572/53215150-adc4ed00-3692-11e9-9ff0-a03f2925fdad.png)

## 謝辞
i18nの方式はMisskeyを参考にしました。
