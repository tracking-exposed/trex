#!/usr/bin/env python
from shared import getPName, createProfile, initialize
import sys, time

def openURL(url, driver):
    try:
        driver.get(url)
        cookie = driver.get_cookie('CONSENT')
        cookies = driver.get_cookies()
        print("this would be closed in 40 seconds", cookie, cookies)
        time.sleep(20)
    except:
        print("failure in connecting", url)


driver = initialize(sys.argv[-1])
with open(sys.argv[-1]) as cfg:
    urls = cfg.readlines()
    for url in urls:
        print("Opening page:", url)
        openURL(url, driver)
    print("Access completed!")
    driver.close()
