# finance-tracker

Googleフォームの出費入力とVpassメール明細をDiscordに通知するGoogle Apps Script。

## 機能

- **フォーム通知**: Googleフォームに出費を入力すると即座にDiscordへ通知
- **Vpass速報**: 三井住友カードの利用通知メールを検知してDiscordへ転送（1分間隔ポーリング）

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. Script Propertiesの設定

GASエディタの「プロジェクトの設定 → スクリプト プロパティ」に以下を追加。

| キー | 値 |
|---|---|
| `DISCORD_WEBHOOK_URL` | DiscordのWebhook URL |
| `DISCORD_THREAD_ID` | 通知先のスレッドID（任意） |

### 3. デプロイ

```bash
npm run push
```

### 4. トリガーの設定

GASエディタで `setupVpassTrigger` を実行すると、1分ごとに `checkVpassEmails` が動くトリガーが登録される。

フォーム通知は、GASエディタの「トリガー」からスプレッドシートの「フォーム送信時」に `onExpenseFormSubmit` を紐づける。

## コマンド

```bash
npm run build   # TypeScriptをビルド
npm run push    # ビルド＆GASへデプロイ
npm run pull    # GASから最新を取得
npm run open    # ブラウザでGASエディタを開く
```

## デバッグ用関数

| 関数 | 内容 |
|---|---|
| `debugVpassEmail` | 最新のVpassメールの本文とパース結果をログ出力 |
| `testVpassNotification` | 最新のVpassメールをパースしてDiscordに送信 |
| `testDiscordMessage` | テスト文字列をDiscordに送信 |
| `setupVpassTrigger` | Vpassポーリングトリガーを登録 |
| `removeVpassTrigger` | Vpassポーリングトリガーを削除 |
