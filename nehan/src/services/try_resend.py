import os

import resend
from dotenv import load_dotenv

# 環境変数の設定
load_dotenv()

# Resend APIキーの設定
resend.api_key = os.getenv("RESEND_API_KEY")
if not resend.api_key:
    raise ValueError(
        "RESEND_API_KEYが設定されていません。.envファイルを確認してください。"
    )

params: resend.Emails.SendParams = {
    "from": "ResendTester <info@saiand.co>",
    "to": ["juggleryusuke1225science@gmail.com"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
}

email = resend.Emails.send(params)
print(email)
