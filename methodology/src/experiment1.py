#!/usr/bin/env python


from selenium.webdriver import Firefox

# from trexmethod import *

def openVideo(url, driver):
    """
    First doubt: is it better create a new window ewa
    """

    driver.get(url);

    cookie = driver.get_cookie('CONSENT');
    cookies = driver.get_cookies();
    print(cookie, cookies);

    while True:
        player_status = driver.execute_script("return document.getElementById('movie_player').getPlayerState()");
        condition = {
            -1: "unstarted",
            0: "ended",
            1: "playing",
            2: "paused",
            3: "buffering",
            5: "video cued",
        }
        if(player_status == -1):
            rect = driver.get_window_rect();
            size = driver.get_window_size();

            import selenium.webdriver.common.action_chains as ac;
            playerElement = driver.find_element_by_css_selector("#player-container");
            playerElement.screenshot('test.png');
            actions = ac.ActionChains(driver)
            actions.move_to_element(playerElement);
            actions.click()
            actions.perform()

            import pdb; pdb.set_trace();
            driver.click();
            # -- still to be implemented -  startVideo(driver);
        elif(player_status == 0):
            # -- still to be implemented - closeVideo(driver);
            driver.quit();
        elif(player_status == 1):
            filename = "{}.dump/{}.png".format(groupName, order);
            driver.get_screenshot_as_file(filename);
            print("Saved screenshoot on", filename);
        else:
            print("Ignored condition", condition[player_status]);



"""
from selenium import webdriver
import time

options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument("--test-type")
options.binary_location = "/usr/bin/chromium"
driver = webdriver.Chrome(chrome_options=options)
driver.get('https://python.org')

"""

# Here the flow begin
urlList = [ 
    'https://www.youtube.com/watch?v=qaM80BjvLuA',
    'https://www.youtube.com/watch?v=6McuxV0Krxw'
];

driver = Firefox()
driver.set_page_load_timeout(40);

for url in urlList:
    print("Opening %s", url);
    openVideo(url, driver);
    
