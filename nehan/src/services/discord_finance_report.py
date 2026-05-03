import argparse
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests  # type: ignore

from config import get_parameters

# 設定の取得
config = get_parameters()

# 必須の環境変数をチェック
required_params = [
    "DISCORD_BOT_TOKEN",
    "PROD_NOTIFICATION_CHANNEL_ID",
    "DEV_NOTIFICATION_CHANNEL_ID",
    "EXPENSE_SOURCE_CHANNEL_ID",
]

for param in required_params:
    if not config.get(param):
        raise ValueError(f"{param} is not set to env config.")

# 定数の定義
HEADERS = {"Authorization": f"Bot {config['DISCORD_BOT_TOKEN']}"}
PARAMS = {"limit": 100}
PROD_NOTIFICATION_CHANNEL_ID = config["PROD_NOTIFICATION_CHANNEL_ID"]
DEV_NOTIFICATION_CHANNEL_ID = config["DEV_NOTIFICATION_CHANNEL_ID"]
EXPENSE_SOURCE_CHANNEL_ID = config["EXPENSE_SOURCE_CHANNEL_ID"]

COL_DATE_INDEX = 0
COL_PLACE_INDEX = 1
COL_DETAIL_INDEX = 2
COL_AMOUNT_INDEX = 3


def get_messages(channel_id, start_date=None, end_date=None):
    """
    指定されたDiscordチャンネルから期間内のメッセージを取得する

    Args:
        channel_id (str): 取得対象のDiscordチャンネルID
        start_date (datetime, optional): 取得開始日時
        end_date (datetime, optional): 取得終了日時

    Returns:
        list: 取得したメッセージのリスト
    """
    messages = []
    base_url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    last_message_id = None

    while True:
        if last_message_id:
            PARAMS["before"] = last_message_id

        response = requests.get(base_url, headers=HEADERS, params=PARAMS)
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            break

        data = response.json()
        if not data:
            break

        filtered_messages = filter_messages_by_date(data, start_date, end_date)
        messages.extend(filtered_messages)

        if should_stop_fetching(data, start_date):
            break

        last_message_id = data[-1]["id"]
        if len(data) < 100:
            break

        time.sleep(1)

    return messages


def filter_messages_by_date(messages, start_date, end_date):
    """
    メッセージを日付でフィルタリングする

    Args:
        messages (list): フィルタリング対象のメッセージリスト
        start_date (datetime): 開始日
        end_date (datetime): 終了日

    Returns:
        list: フィルタリングされたメッセージリスト
    """
    filtered = []
    jst = ZoneInfo("Asia/Tokyo")
    for msg in messages:
        # UTCのタイムスタンプをJSTに変換
        msg_date = datetime.fromisoformat(
            msg["timestamp"].replace("Z", "+00:00")
        ).astimezone(jst)
        if start_date and msg_date < start_date:
            continue
        if end_date and msg_date > end_date:
            continue
        filtered.append(msg)
    return filtered


def should_stop_fetching(data, start_date):
    """
    メッセージ取得を停止すべきか判断する

    Args:
        data (list): 取得したメッセージデータ
        start_date (datetime): 開始日

    Returns:
        bool: 停止すべき場合はTrue
    """
    if not start_date:
        return False
    jst = ZoneInfo("Asia/Tokyo")
    return (
        datetime.fromisoformat(data[-1]["timestamp"].replace("Z", "+00:00")).astimezone(
            jst
        )
        < start_date
    )


def calculate_total_amount(messages):
    """
    メッセージリストから合計金額を計算する

    Args:
        messages (list): メッセージのリスト

    Returns:
        int: 合計金額
    """
    total_amount = 0
    for msg in messages:
        content = msg["content"]
        if content:
            try:
                amount_str = content.split()[COL_AMOUNT_INDEX].replace(",", "")
                amount = int(amount_str)
                total_amount += amount
            except (ValueError, IndexError):
                continue
    return total_amount


def make_daily_report(channel_id, date):
    """
    指定日の合計金額のみのレポートを生成する

    Args:
        channel_id (str): チャンネルID
        date (datetime): 対象日

    Returns:
        str: レポートメッセージ
    """
    msgs = get_messages(channel_id, date, date + timedelta(days=1))
    total_amount = calculate_total_amount(msgs)
    return f"合計金額: {total_amount:,}円"


def make_weekly_report(channel_id, start_date, end_date):
    """
    週間の詳細レポートを生成する

    Args:
        channel_id (str): チャンネルID
        start_date (datetime): 開始日
        end_date (datetime): 終了日

    Returns:
        str: レポートメッセージ
    """
    msgs = get_messages(channel_id, start_date, end_date)

    # メッセージを内容の日付でソート
    sorted_msgs = sorted(
        msgs, key=lambda x: x["content"].split()[COL_DATE_INDEX] if x["content"] else ""
    )

    report_msg = ""
    for msg in sorted_msgs:
        content = msg["content"]
        if content:
            report_msg += content + "\n"

    total_amount = calculate_total_amount(msgs)
    report_msg += f"\n合計金額: {total_amount:,}円"
    return report_msg


def format_report_message(title, start_date, end_date, content, is_weekly=False):
    """
    レポートメッセージをフォーマットする

    Args:
        title (str): レポートのタイトル
        start_date (datetime): 開始日
        end_date (datetime): 終了日
        content (str): レポートの内容
        is_weekly (bool): 週間レポートかどうか

    Returns:
        str: フォーマットされたレポートメッセージ
    """
    message = (
        "---\n"
        f"# {title}\n"
        f"開始日: {start_date.strftime('%Y-%m-%d')}\n"
        f"終了日: {end_date.strftime('%Y-%m-%d')}\n"
    )

    if is_weekly:
        message += "スプレッドシートに下記を追記してください\n"

    message += f"\n{content}"
    return message


def send_message_to_channel(channel_id, content):
    """
    指定されたチャンネルにメッセージを送信する

    Args:
        channel_id (str): 送信先のチャンネルID
        content (str): 送信するメッセージ内容
    """
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    payload = {"content": content}
    response = requests.post(url, headers=HEADERS, json=payload)

    if response.status_code != 200:
        print(f"Error sending message: {response.status_code} - {response.text}")
    else:
        print("Message sent successfully")


def run_report(end_date=None, is_dev=False):
    """
    レポートを実行する

    Args:
        end_date (str, optional): 終了日 (YYYY-MM-DD形式)
        is_dev (bool, optional): 開発モードで実行するかどうか

    Returns:
        dict: 実行結果
    """
    # 通知チャンネルIDの設定
    NOTIFICATION_CHANNEL_ID = (
        DEV_NOTIFICATION_CHANNEL_ID if is_dev else PROD_NOTIFICATION_CHANNEL_ID
    )

    jst = ZoneInfo("Asia/Tokyo")

    try:
        if end_date:
            # 指定された終了日でレポートを生成
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
            end_date_dt = datetime(
                end_date_dt.year,
                end_date_dt.month,
                end_date_dt.day,
                23,
                59,
                00,
                tzinfo=jst,
            )
            start_date = end_date_dt - timedelta(days=6)
            start_date = start_date.replace(
                hour=0, minute=0, second=0
            )  # 開始日は0時0分

            # 週間レポートを生成
            weekly_report = make_weekly_report(
                EXPENSE_SOURCE_CHANNEL_ID, start_date, end_date_dt
            )
            weekly_message = format_report_message(
                "出費レポート(Weekly)",
                start_date,
                end_date_dt,
                weekly_report,
                is_weekly=True,
            )
            send_message_to_channel(NOTIFICATION_CHANNEL_ID, weekly_message)
            return {"status": "success", "message": "週間レポートを送信しました"}
        else:
            # 通常の処理（毎日のレポートと日曜日の週間レポート）
            today = datetime.now(jst)
            today_start = datetime(
                today.year, today.month, today.day, 0, 0, 0, tzinfo=jst
            )
            today_end = datetime(
                today.year, today.month, today.day, 23, 59, 00, tzinfo=jst
            )

            # 毎日のレポート（合計金額のみ）
            daily_report = make_daily_report(EXPENSE_SOURCE_CHANNEL_ID, today_start)
            daily_message = format_report_message(
                "出費レポート",
                today_start,
                today_start,  # 日次レポートでは開始日と終了日は同じ
                daily_report,
            )
            send_message_to_channel(NOTIFICATION_CHANNEL_ID, daily_message)

            # 日曜日の場合は週間レポートも送信
            if today.weekday() == 6:
                week_start = today_start - timedelta(days=6)
                weekly_report = make_weekly_report(
                    EXPENSE_SOURCE_CHANNEL_ID, week_start, today_end
                )
                weekly_message = format_report_message(
                    "出費レポート(Weekly)",
                    week_start,
                    today_end,
                    weekly_report,
                    is_weekly=True,
                )
                send_message_to_channel(NOTIFICATION_CHANNEL_ID, weekly_message)
                return {
                    "status": "success",
                    "message": "日次レポートと週間レポートを送信しました",
                }

            return {"status": "success", "message": "日次レポートを送信しました"}

    except ValueError as e:
        return {"status": "error", "message": f"エラー: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"予期せぬエラーが発生しました: {str(e)}"}


if __name__ == "__main__":
    # コマンドライン引数の設定
    parser = argparse.ArgumentParser(description="Discord出費レポート生成")
    parser.add_argument("-e", "--end-date", type=str, help="終了日 (YYYY-MM-DD形式)")
    parser.add_argument("--dev", action="store_true", help="開発モードで実行")
    args = parser.parse_args()

    # レポートを実行
    result = run_report(end_date=args.end_date, is_dev=args.dev)
    print(result["message"])
