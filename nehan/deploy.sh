#!/bin/bash
set -e

# 引数からデプロイ環境を取得（デフォルトはproduction）
ENVIRONMENT=${1:-production}
STACK_NAME="my-daily-lambda-${ENVIRONMENT}"

echo "Deploying to ${ENVIRONMENT} environment..."

# .envファイルから環境変数を読み込む
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Parameter Storeにパラメータが存在するか確認し、なければ作成するヘルパー関数
ensure_parameter() {
  local param_name="/my-private-discord-app/${ENVIRONMENT}/$1"
  local param_value="$2"
  local param_exists
  
  param_exists=$(aws ssm get-parameters --names "$param_name" --query "Parameters[*].Name" --output text 2>/dev/null --profile y2m_1-PowerUserAccess-804103150447 || echo "")
  
  if [ -z "$param_exists" ]; then
    echo "Creating parameter $param_name..."
    
    # JSON形式でパラメータを作成
    json_input=$(cat << EOF
{
    "Name": "$param_name",
    "Value": "$param_value",
    "Type": "SecureString",
    "Overwrite": true,
    "Tier": "Standard"
}
EOF
    )
    
    aws ssm put-parameter \
      --cli-input-json "$json_input" \
      --profile y2m_1-PowerUserAccess-804103150447
  else
    echo "Parameter $param_name already exists."
  fi
}

# 必要なパラメータを確認
ensure_parameter "discord_bot_token" "$DISCORD_BOT_TOKEN"
ensure_parameter "prod_notification_channel_id" "$PROD_NOTIFICATION_CHANNEL_ID"
ensure_parameter "dev_notification_channel_id" "$DEV_NOTIFICATION_CHANNEL_ID"
ensure_parameter "expense_source_channel_id" "$EXPENSE_SOURCE_CHANNEL_ID"

# パッケージをビルド
echo "Building package..."
sam build 

# デプロイ
echo "Deploying stack ${STACK_NAME}..."
sam deploy \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides "Environment=${ENVIRONMENT}" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --profile y2m_1-PowerUserAccess-804103150447

echo "Deployment completed successfully!"
