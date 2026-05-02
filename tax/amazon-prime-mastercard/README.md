# Amazon Prime Mastercard 個人支出振り分け (GAS)

Amazon Prime Mastercardの利用明細から個人支出をキーワードマッチングで自動分類し、Excelファイルとしてエクスポートする Google Apps Script プロジェクト。

## 機能

- **個人支出自動分類** - `個人項目`シートに定義したキーワードで`rawData`シートのC列をチェックし、A列に記号を挿入
  - `◯` : 全額個人負担
  - `△` : 一部個人負担
- **Excelエクスポート** - 年月を指定してXLSX形式でGoogle Driveに保存
- **リセット** - `rawData`シートのデータをクリア（A1セルは保持）

## スプレッドシート構成

| シート名 | 用途 |
|----------|------|
| `rawData` | カード利用明細データ（A列: 分類記号, C列: 利用内容） |
| `個人項目` | 分類キーワード定義（A列: 全額負担ワード, B列: 一部負担ワード） |

## セットアップ

```bash
npm install
```

`@google/clasp` がグローバルまたはプロジェクトにインストールされていること。

## コマンド

| コマンド | 説明 |
|----------|------|
| `npm run build` | TypeScriptコンパイル + `appsscript.json`を`build/`にコピー |
| `npm run push` | ビルド後、claspでGASプロジェクトへデプロイ |
| `npm run pull` | GASプロジェクトから最新コードを取得 |
| `npm run open` | ブラウザでGASエディタを開く |

## プロジェクト構成

```
├── src/
│   ├── main.ts            # メインロジック（分類・エクスポート・メニュー）
│   └── appsscript.json    # GASマニフェスト（V8ランタイム, Asia/Tokyo）
├── scripts/
│   └── copy-appsscript.mjs  # ビルド時にマニフェストをbuild/へコピー
├── build/                 # コンパイル出力（clasp pushの対象）
├── .clasp.json            # claspプロジェクト設定
├── tsconfig.json          # TypeScript設定
└── package.json
```

## 技術スタック

- TypeScript → ES2020にコンパイル
- Google Apps Script (V8ランタイム)
- `@google/clasp` でデプロイ管理
