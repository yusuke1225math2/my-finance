"""ufj directにログインして過去30日のcsvをダウンロード"""
import json
from logging import getLogger
from pathlib import Path
from time import sleep

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

from config.selenium_conf import selenium_options

with open(Path(__file__).parent / '../credentials/credentials.json', 'r', encoding='utf-8') as f_c:
    credentials = json.load(f_c)

logger = getLogger(__name__)


class UfjDriver():
    credentials = credentials['ufj']

    def __init__(self, headless=True):
        if headless:
            selenium_options.add_argument('--headless')
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=selenium_options
        )

    def login(self):
        try:
            self.driver.get('https://directg.s.bk.mufg.jp/APL/LGP_P_01/PU/LG_0001/LG_0001_PC01?link_id=direct_leftmenu_login_PC')
            logger.info('Opened: ufjログインページ')
            sleep(5)
            xpath_contract_number = '//input[@id="tx-contract-number"]'
            self.driver.find_element(By.XPATH, xpath_contract_number).send_keys(self.credentials['contract-number'])
            xpath_password = '//input[@id="tx-ib-password"]'
            self.driver.find_element(By.XPATH, xpath_password).send_keys(self.credentials['password'])
            xpath_login_button = '//button[text()="ログイン"]'
            self.driver.find_element(By.XPATH, xpath_login_button).click()
            logger.info('Clicked: ログインボタン')
        except NoSuchElementException:
            logger.exception()

    def logout(self):
        xpath_logout = '(//a[contains(text(), "ログアウト")])[1]'
        try:
            self.driver.find_element(By.XPATH, xpath_logout).click()
            logger.info('Clicked: ログアウトボタン')
        except NoSuchElementException:
            logger.exception()
        finally:
            self.driver.quit()

    def get_csv(self):
        try:
            xpath_detail = '//div[contains(@class, "main-account")]/..'
            self.driver.find_element(By.XPATH, xpath_detail).click()
            logger.info('Clicked: 入出金明細')
            sleep(5)
            xpath_download_detail = '//span[contains(text(), "明細ダウンロード")]/..'
            self.driver.find_element(By.XPATH, xpath_download_detail).click()
            logger.info('Clicked: 明細ダウンロード')
            sleep(5)
            xpath_download_csv = '//img[@alt="ダウンロード（CSV形式）"]/..'
            self.driver.find_element(By.XPATH, xpath_download_csv).click()
            logger.info('Clicked: csvダウンロードボタン')
            sleep(5)
            Alert(self.driver).accept()
            logger.info('Clicked: alertポップアップok')
        except NoSuchElementException:
            logger.exception()
