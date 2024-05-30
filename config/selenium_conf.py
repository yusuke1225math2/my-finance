from pathlib import Path

from selenium.webdriver.chrome.options import Options

root = Path(__file__).parent.parent

selenium_options = Options()
selenium_options.add_argument('--lang=ja-JP')
selenium_options.add_argument('--blink-settings=imagesEnabled=false')
prefs = {
    'download.default_directory': str(root / 'downloads'),
    'plugins.always_open_pdf_externally': True
}
selenium_options.add_experimental_option('prefs', prefs)
