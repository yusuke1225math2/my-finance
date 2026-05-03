# src/config.py
import os

import boto3  # type: ignore
from dotenv import load_dotenv


def get_parameters():
    """
    本番環境ではSSM Parameter Storeから、ローカル環境では.envファイルから
    設定値を取得する
    """
    # ローカル開発環境の場合
    if os.environ.get("ENVIRONMENT") == "development":
        load_dotenv()  # .envファイルから環境変数を読み込み
        return {
            "DISCORD_BOT_TOKEN": os.environ.get("DISCORD_BOT_TOKEN"),
            "PROD_NOTIFICATION_CHANNEL_ID": os.environ.get(
                "PROD_NOTIFICATION_CHANNEL_ID"
            ),
            "DEV_NOTIFICATION_CHANNEL_ID": os.environ.get(
                "DEV_NOTIFICATION_CHANNEL_ID"
            ),
            "EXPENSE_SOURCE_CHANNEL_ID": os.environ.get("EXPENSE_SOURCE_CHANNEL_ID"),
        }

    # Lambda環境（本番・ステージング）の場合
    else:
        # Parameter Storeからパラメータを取得
        ssm = boto3.client("ssm")
        env = os.environ.get("ENVIRONMENT", "production")
        print(f"{env=}")
        response = ssm.get_parameters(
            Names=[
                f"/my-private-discord-app/{env}/discord_bot_token",
                f"/my-private-discord-app/{env}/prod_notification_channel_id",
                f"/my-private-discord-app/{env}/dev_notification_channel_id",
                f"/my-private-discord-app/{env}/expense_source_channel_id",
            ],
            WithDecryption=True,  # 暗号化されたパラメータを復号化
        )

        # パラメータ名をキーとする辞書に変換
        key_mapping = {
            "discord_bot_token": "DISCORD_BOT_TOKEN",
            "prod_notification_channel_id": "PROD_NOTIFICATION_CHANNEL_ID",
            "dev_notification_channel_id": "DEV_NOTIFICATION_CHANNEL_ID",
            "expense_source_channel_id": "EXPENSE_SOURCE_CHANNEL_ID",
        }

        parameters = {}
        for param in response["Parameters"]:
            # パス名から最後の部分を取得
            name = param["Name"].split("/")[-1]
            if name in key_mapping:
                parameters[key_mapping[name]] = param["Value"]

        print(f"{parameters.keys()=}")

        return parameters
