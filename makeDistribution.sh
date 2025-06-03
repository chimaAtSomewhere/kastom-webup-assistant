#!/bin/bash

# 出力ファイル名
HTML_FILE="image-joiner.html"
JS_FILE="join-image.js"

# `image-joiner.js` が存在しない場合はエラー
if [[ ! -f "$JS_FILE" ]]; then
  echo "Error: $JS_FILE が見つかりません。先に作成してください。" >&2
  exit 1
fi

# `image-joiner.js` の内容を取得
JS_CONTENT=$(cat "$JS_FILE")

# `index.html` を生成
cat <<EOF > "$HTML_FILE"
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Image Collage Maker</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      canvas {
        border: 1px solid #ccc;
        margin-bottom: 10px;
      }
      .collage-container {
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Image Joiner</h1>
    <p>
      複数画像をアップロードして、EC サイトの上限（例：10 枚、20
      枚）に合わせたコラージュ画像を作成します。
    </p>
    <input type="file" id="files" multiple accept="image/*" />
    <br /><br />
    <label for="limitNumber">上限枚数:</label>
    <input type="number" id="limitNumber" value="20" min="1" />
    <br /><br />
    <label for="fileNamePrefix">画像名接頭辞:</label>
    <input type="text" id="fileNamePrefix" value="image_" />
    <br /><br />
    <button id="joinImages">画像を結合</button>

    <div id="garally" class="garally-container"></div>

    <script>
$JS_CONTENT
    </script>
  </body>
</html>

EOF

echo "HTMLファイル '$HTML_FILE' を生成しました。"
