# YusukeSena の Discord 自動化

## 環境構築

- `uv init`
- `uv venv`
- `uv pip install -r src/requirements.txt`
- `uv pip install -e .`
- `source .venv/Scripts[bin]/activate`

## 家計管理機能

- スプレッドシート
  - [Discord 家計管理 - Google スプレッドシート](https://docs.google.com/spreadsheets/d/1UKSunWbNf45nlScNneZdNUty1SI9K54HmlMkQIVsSBo/edit?gid=0#gid=0)

## DiscordAPI

- `.env`に bot トークン記載

## GoogleAPI

- credentials: サービスアカウントキー

## AWS CLI

- CloudFormation スタックの確認
  - `aws cloudformation describe-stacks --stack-name my-daily-lambda-development --profile y2m_1-PowerUserAccess-804103150447`
- Lambda 関数の状態確認
  - `aws lambda get-function --function-name DailyScheduledFunction --profile y2m_1-PowerUserAccess-804103150447`
- デプロイ

  ```bash
    sam deploy \
      --stack-name "my-daily-lambda-production" \
      --parameter-overrides "Environment=production" \
      --capabilities CAPABILITY_IAM \
      --no-fail-on-empty-changeset \
      --profile y2m_1-PowerUserAccess-804103150447
  ```
