# TODO

## Cloud Functions 移行検討

### 背景
GAS から Discord Webhook に通知する現行構成で、`429 / error code: 1015`（Cloudflare レートリミット）を継続的に食らうことがある。
GAS の実行サーバーIPは他ユーザーと共有のため、自分の送信量と無関係に巻き添えブロックされる可能性が高い。

### 移行先候補
- **Google Cloud Functions (2nd gen)** ＋ Cloud Scheduler
  - GASとほぼ同じ世界観で、Gmail APIを直接叩く
  - 単一プロジェクトのIPになるため Cloudflare 1015 を踏みにくい
- **AWS Lambda** ＋ EventBridge
  - 既に `nehan/` で Lambda + SAM の運用実績あり
  - 統合性を優先するならこちら
- (Cloudflare Workers / Vercel Cron なども選択肢としてあるが、Gmail API認証が面倒)

### 移行が必要なコンポーネント
- `src/vpass.ts` — Gmail検索 + 本文パース + Discord送信のコア
- `src/discord.ts` — Discord Webhook送信
- `src/form.ts` — Googleフォーム送信トリガー（→ GAS残置 or Pub/Sub経由でCFに飛ばす）
- 処理済みメッセージIDの永続化（GAS: ScriptProperties → CF: Firestore / GCS / Secret Manager）

### 移行作業項目
- [ ] Gmail API のサービスアカウント/OAuth設定（GASは自動でユーザー権限を引き継ぐが、CFでは明示的に必要）
- [ ] 処理済みID永続化の置き換え（Firestoreが手軽）
- [ ] Cloud Scheduler で 1分トリガー（GASのtime-based triggerと同等）
- [ ] Discord送信失敗時のリトライ/バックオフ（クールダウン機構を再導入）
- [ ] Googleフォーム連携の扱いを決める（GAS残置が現実的か）
- [ ] 既存 GAS の checkVpassEmails トリガー停止 + processedIds データ移行

### 残置判断
- フォーム連携（`form.ts`）は Apps Script のフォーム送信トリガーが便利なので GAS 残置でよい
- Vpassポーリングだけ Cloud Functions に切り出すのが現実的

### 参考
- `nehan/template.yml` — Lambda + SAM の構成例
- Discord Webhook rate limit: 5 msg / 2sec per webhook, Cloudflare WAF は ~10k req / 10min per IP
