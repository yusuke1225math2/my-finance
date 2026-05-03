# Plan: nehan_discord_automation を my-finance に統合

## Context

`nehan_discord_automation` は Discord チャンネルに記録した出費を集計して日次・週次レポートを投稿する AWS Lambda システム。管理先を `my-finance` に一本化したい。

- コードのみ移植（AWS SAM インフラも含む）
- 依存管理は uv（nehan/ 内で独立、my-finance の既存 Poetry には触れない）
- nehan リポジトリはしばらく残す（アーカイブしない）

---

## 移植するファイル

`nehan_discord_automation` → `my-finance/nehan/` に以下をそのままコピー：

| 元ファイル | 移植先 |
|---|---|
| `src/__init__.py` | `nehan/src/__init__.py` |
| `src/config.py` | `nehan/src/config.py` |
| `src/lambda_function.py` | `nehan/src/lambda_function.py` |
| `src/requirements.txt` | `nehan/src/requirements.txt` |
| `src/services/__init__.py` | `nehan/src/services/__init__.py` |
| `src/services/discord_finance_report.py` | `nehan/src/services/discord_finance_report.py` |
| `src/services/try_resend.py` | `nehan/src/services/try_resend.py` |
| `template.yml` | `nehan/template.yml` |
| `deploy.sh` | `nehan/deploy.sh` |
| `pyproject.toml` | `nehan/pyproject.toml` |
| `.python-version` | `nehan/.python-version` |
| `.flake8` | `nehan/.flake8` |
| `tests/local_test.py` | `nehan/tests/local_test.py` |
| `README.md` | `nehan/README.md` |

---

## 依存管理（uv）

nehan/ 内は既存の構造を維持：
- `nehan/pyproject.toml` — パッケージ定義（setuptools ベース、変更なし）
- `nehan/src/requirements.txt` — Lambda デプロイ用 + ローカル開発用
- ローカルセットアップ: `cd nehan && uv venv && uv pip install -r src/requirements.txt && uv pip install -e .`

my-finance ルートの `pyproject.toml`（Poetry）には一切手を加えない。

---

## CLAUDE.md 更新

`my-finance/CLAUDE.md` に `nehan/` セクションを追加：

```markdown
### `nehan/` - Discord 出費レポート（Python / AWS Lambda）
- `src/services/discord_finance_report.py` — Discord API でメッセージ取得、日次・週次集計レポートを通知チャンネルに送信
- `src/config.py` — ローカル: `.env` / Lambda 本番: AWS SSM Parameter Store から設定取得
- `template.yml` — AWS SAM テンプレート（毎日 JST 23:50 に自動実行）
- `deploy.sh` — SSM パラメータ確認 + SAM build/deploy
- ローカルテスト: `cd nehan && python tests/local_test.py`
- デプロイ: `cd nehan && ./deploy.sh [production|development]`
```

---

## 実装手順

1. nehan_discord_automation の全ソースファイルを `my-finance/nehan/` に移植
2. `my-finance/CLAUDE.md` に `nehan/` セクションを追加

---

## 検証

- `my-finance/nehan/src/services/discord_finance_report.py` が存在すること
- `my-finance/CLAUDE.md` に nehan セクションが追加されていること
- 既存の `ufj/`, `rakuten/`, `tax/` が変更されていないこと
