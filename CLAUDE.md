# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

日本の金融サービス（UFJダイレクト、楽天カード、Amazon Prime Mastercard）から取引データを取得し、Google Sheetsへ重複排除・カテゴリ分類付きで同期する個人財務自動化プロジェクト。Discord 出費レポートの自動送信も含む。

## コマンド

### Python（UFJ自動化）
```bash
poetry install                  # Python依存関係インストール
python test_ufj.py              # 全工程: ログイン → CSV取得 → スプレッドシート更新
python test_ufj_driver.py       # UFJログイン＆CSVダウンロードのみ
python test_ufj_csv_upload.py   # スプレッドシート更新のみ
```

### Google Apps Script（Amazon Prime Mastercard）
```bash
cd tax/amazon-prime-mastercard
npm run build    # TypeScriptコンパイル（tsc + appsscript.jsonコピー）
npm run push     # ビルド＆claspでGASへデプロイ
npm run pull     # GASから最新を取得
npm run open     # ブラウザでスクリプトを開く
```

### Discord出費レポート（nehan / AWS Lambda）
```bash
cd nehan
uv venv && uv pip install -r src/requirements.txt && uv pip install -e .
python tests/local_test.py      # ローカルテスト
./deploy.sh production          # 本番デプロイ
./deploy.sh development         # 開発デプロイ
```

## アーキテクチャ

金融データソースごとに独立したモジュールで構成。

### `ufj/` - UFJダイレクト連携（Python）
- `ufj_driver.py` - Seleniumによるブラウザ自動化。UFJダイレクトにログインし、取引CSVをダウンロード（Shift-JISエンコード）
- `ufj_sheets.py` - ダウンロードしたCSVを読み込み、pandasで既存のGoogle Sheetsデータとマージ。複合キー（日付+摘要+金額）で重複排除し、ユーザー入力済みのカテゴリ列を保持
- `gspread` + `oauth2client`でGoogle Sheets API接続。`credentials/client_secret.json`（サービスアカウント）が必要

### `rakuten/` - 楽天カードメール解析（GAS / JavaScript）
- `get_rakuten_mail.js` - Gmailから楽天カード利用明細メールを検索し、正規表現で取引詳細を抽出、重複チェック付きでGoogle Sheetsに挿入

### `tax/amazon-prime-mastercard/` - Amazon Prime Mastercard経費分類（GAS / TypeScript）
- `src/main.ts` - キーワードマッチングで個人支出を分類（◯:全額、△:一部）。フィルタしたデータをExcel（XLSX）にエクスポート。Google Sheetsにカスタムメニュー追加

### `nehan/` - Discord出費レポート（Python / AWS Lambda）
- `src/services/discord_finance_report.py` - Discord APIでメッセージ取得、日次・週次集計レポートを通知チャンネルに送信
- `src/config.py` - ローカル: `.env` / Lambda本番: AWS SSM Parameter Storeから設定取得
- `template.yml` - AWS SAMテンプレート（毎日JST 23:50に自動実行）
- `deploy.sh` - SSMパラメータ確認 + SAM build/deploy

### `config/` - 共通設定
- `selenium_conf.py` - Chrome WebDriver設定（ヘッドレス、日本語ロケール、`./downloads`に保存）
- `log_conf.json` - ローテーションファイルロガー（10MB/ファイル、40世代、`./logs/debug.log`に出力）

## 技術的な注意点

- Python 3.12、Poetryで管理（UFJ等）/ uvで管理（nehan/）
- UFJのCSVはShift-JISエンコード、ローカル中間ファイルはUTF-8
- Seleniumの操作間にページ読み込み待ちとして5秒のsleepあり
- `credentials/`はgitignore対象。`credentials.json`（UFJログイン情報）と`client_secret.json`（Googleサービスアカウント）を手動配置する必要あり
- GASプロジェクトはV8ランタイム、タイムゾーンはAsia/Tokyo
- TypeScriptは`build/`にコンパイルされ、`@google/clasp`でデプロイ
- nehan/の依存はuv管理、Lambda実行環境用に`src/requirements.txt`を使用
