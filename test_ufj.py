from time import sleep

from ufj import ufj_sheets
from ufj.ufj_driver import UfjDriver


def main():
    """UFJダイレクトにログインしてcsvダウンロード後、スプレッドシート更新"""
    ufj_driver = UfjDriver()
    ufj_driver.login()
    sleep(5)
    ufj_driver.get_csv()
    sleep(5)
    ufj_driver.logout()
    ufj_sheets.update_sheet_with_no_duplicates()


if __name__ == '__main__':
    main()
