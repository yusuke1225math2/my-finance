import json

from services.discord_finance_report import run_report


def lambda_handler(event, context):
    """
    AWS Lambdaのハンドラー関数

    Args:
        event (dict): Lambdaのイベントデータ
        context (object): Lambdaのコンテキスト

    Returns:
        dict: レスポンスデータ
    """
    try:
        # イベントからパラメータを取得
        end_date = event.get("end_date")
        is_dev = event.get("dev", False)

        # レポートを実行
        result = run_report(end_date=end_date, is_dev=is_dev)

        return {
            "statusCode": 200 if result["status"] == "success" else 500,
            "body": json.dumps(
                {"status": result["status"], "message": result["message"]},
                ensure_ascii=False,
            ),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "status": "error",
                    "message": f"予期せぬエラーが発生しました: {str(e)}",
                },
                ensure_ascii=False,
            ),
        }
