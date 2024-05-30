from time import sleep

from ufj.ufj_driver import UfjDriver


def main():
    ufj_driver = UfjDriver()
    ufj_driver.login()
    sleep(5)
    ufj_driver.get_csv()
    sleep(5)
    ufj_driver.logout()


if __name__ == '__main__':
    main()
