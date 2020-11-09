#!/usr/bin/env python
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import os, sys, time, errno
from shared import getPName, createProfile, initialize

def buildScreenName(prefix):
    profileName = os.path.join('snaps', getPName(sys.argv[-1]))
    try:
        os.makedirs(profileName)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    filename = "{}/{}.png".format(profileName, prefix)
    print("Returning", filename)
    return filename

def checkStatus(driver, urlNumber, framenumber):
    pname = getPName(sys.argv[-1])
    player_status = driver.execute_script("return document.getElementById('movie_player').getPlayerState()")
    condition = {
        -1: "unstarted",
        0: "ended",
        1: "playing",
        2: "paused",
        3: "buffering",
        5: "video cued",
    }
    print("Video Status:", player_status, condition[player_status])
    if(player_status == -1):
        print("Video still hanging: sending click!")
        import selenium.webdriver.common.action_chains as ac
        playerElement = driver.find_element_by_css_selector("#player-container")
        previewfname = buildScreenName('{}-{}-preview'.format(pname, urlNumber))
        playerElement.screenshot(previewfname)
        actions = ac.ActionChains(driver)
        actions.move_to_element(playerElement)
        actions.click()
        actions.perform()
        framenumber = 0
    elif(player_status == 0):
        print("Video completed reproduction, closing")
        return -1
    elif(player_status == 1):
        framenumber += 1
        framecopy = buildScreenName("{}-{}-snap-{}".format(pname, urlNumber, framenumber) )
        playerElement = driver.find_element_by_css_selector("#player-container")
        playerElement.screenshot(framecopy)
    else:
        print("Ignored condition", condition[player_status])

    return framenumber

def openVideo(url, driver, urlNumber):
    try:
        driver.get(url)
    except Exception as e:
        print("Error in driver.get:", e.message, "fail in", url);
        return 

    cookie = driver.get_cookie('CONSENT')
    cookies = driver.get_cookies()
    # print(cookie, cookies)
    framenumber = 0
    while True:
        try:
            framenumber = checkStatus(driver, urlNumber, framenumber)
            if(framenumber == -1):
                return
        except Exception as e:
            if not e.msg.startswith('no such element'):
                print("Error in checkStatus", e)
                return 

        time.sleep(5)


driver = initialize(sys.argv[-1])
with open(sys.argv[-1]) as cfg:
    urls = cfg.readlines()
    urlNumber = 1
    for url in urls:
        print("Opening", url)
        openVideo(url, driver, urlNumber)
        urlNumber += 1
    print("Test completed: closing")
    driver.close()
