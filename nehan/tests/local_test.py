# local_test.py
import json

from src.lambda_function import lambda_handler


# ローカルでLambda関数をテスト実行
def run_local_test():
    # 日付指定で開発用出力
    response = lambda_handler(
        {
            "end_date": "2025-03-30",
            "dev": True,
        },
        None,
    )
    print(f"Status Code: {response['statusCode']}")  # レスポンスを整形して表示
    print(f"Response Body: {json.loads(response['body'])}")

    # 日付指定せず開発用出力
    response = lambda_handler(
        {
            "dev": True,
        },
        None,
    )
    print(f"Status Code: {response['statusCode']}")  # レスポンスを整形して表示
    print(f"Response Body: {json.loads(response['body'])}")


if __name__ == "__main__":
    print("Running local test...")
    run_local_test()
