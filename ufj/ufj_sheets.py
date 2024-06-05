"""スプレッドシート更新にまつわる操作"""
import csv
import shutil
from pathlib import Path
from logging import getLogger

import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials

from credentials.credentials import SPREADSHEET_KEY, SHEET_UFJ_CSV

logger = getLogger(__name__)

SCOPE = 'https://spreadsheets.google.com/feeds'
credentials_file_path = Path(__file__).parent.parent / 'credentials/client_secret.json'
credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_file_path, SCOPE)

gc = gspread.authorize(credentials)
workbook = gc.open_by_key(SPREADSHEET_KEY)


def _overwrite_sheet_by_csv(csv_path) -> None:
    """ローカルのcsvでシート内容を上書き"""
    workbook.values_update(
        SHEET_UFJ_CSV,  # どのシートに書き込むのかを指定
        params={'valueInputOption': 'USER_ENTERED'},
        body={'values': list(csv.reader(open(csv_path, encoding='utf-8')))}
    )


def _load_df_from_sheet() -> pd.DataFrame:
    """シートから既存のデータをdataframeにする"""
    worksheet = workbook.worksheet(SHEET_UFJ_CSV)
    existing_df = pd.DataFrame(
        worksheet.get_values()[1:],
        columns=worksheet.get_values()[0]
    )
    return existing_df


def update_sheet_with_no_duplicates():
    """重複行が削除されたデータでスプレッドシートを更新"""
    try:
        csv_dir = Path(__file__).parent.parent / 'downloads'
        csv_path = list(csv_dir.glob('*.csv'))[0]

        # シート既存のデータと、ローカルのcsvデータを結合
        # シートの方には手書きの「カテゴリ」列があるため注意
        existing_df = _load_df_from_sheet()
        csv_df = pd.read_csv(csv_path, encoding='shift-jis', keep_default_na=False)
        concated_df = pd.concat([existing_df, csv_df])

        # ソートして重複行を削除
        concated_df['key'] = concated_df['日付'] + concated_df['摘要内容'] + concated_df['支払い金額'] + concated_df['預かり金額']
        sorted_concated_df = concated_df.sort_values(['key', 'カテゴリ'], ascending=[True, True])
        unique_df = sorted_concated_df.drop_duplicates('key', keep='first')

        # dataframeを一時csv化してシート上書き
        final_df = unique_df.drop('key', axis=1).sort_values('日付', ascending=True)
        tmp_csv_name = 'local_origin.csv'
        final_df.to_csv(tmp_csv_name, index=False, encoding='utf-8')
        _overwrite_sheet_by_csv(tmp_csv_name)
        # Path(tmp_csv_name).unlink()

        # 処理が終わったcsvをuploadedに移動
        shutil.move(csv_path, Path(__file__).parent.parent / 'downloads/uploaded')
    except IndexError:
        logger.exception('downloadsフォルダにcsvがありませんでした')
    except Exception:
        logger.exception('シートの更新中にエラーが発生しました')
