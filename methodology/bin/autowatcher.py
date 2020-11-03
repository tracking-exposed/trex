#!/usr/bin/env python
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import os, sys, time, re, errno
from os.path import basename
from os import makedirs

def getPName(srcstr):
    profileName = re.sub(r'\..*', '', basename(srcstr) )
    if not len(profileName):
        print("Error in picking profile name from", sys.argv, "[", srcstr, "] using '_NONAME' ");
        profileName = '_NONAME'
    return profileName

def buildScreenName(prefix):
    profileName = os.path.join('snaps', getPName(sys.argv[-1]))
    try:
        os.makedirs(profileName)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    filename = "{}/{}.png".format(profileName, prefix);
    print("Returning", filename);
    return filename;

def createProfile(cfgname):
    profilePath = os.path.abspath(os.path.join("profiles", getPName(sys.argv[-1])))
    profileName = getPName(sys.argv[-1])
    if not os.path.exists(profilePath):
        print("You should copy the master directory in", profilePath)
        sys.exit(-1);
    else:
        print("Profile directory found!", profileName)
    profInfo = {};
    profInfo['name'] = profileName
    profInfo['path'] = profilePath
    return profInfo


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
        print("Video still hanging: sending click!");
        import selenium.webdriver.common.action_chains as ac
        playerElement = driver.find_element_by_css_selector("#player-container")
        previewfname = buildScreenName('{}-{}-preview'.format(pname, urlNumber))
        playerElement.screenshot(previewfname)
        actions = ac.ActionChains(driver)
        actions.move_to_element(playerElement)
        actions.click()
        actions.perform()
        framenumber = 0;
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
    driver.get(url)
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


if not os.path.exists(sys.path[-1]):
    print("Not found mandatory configuration file")
    sys.exit(1)

profInfo = createProfile(sys.path[-1])

o = Options()
o.add_argument('--user-data-dir=' + profInfo['path'])
o.add_argument("--dns-prefetch-disable")
o.add_argument("--start-maximized")
o.add_experimental_option("excludeSwitches", ['enable-automation']);

try:
    if(os.environ['CHROME']):
        print("Expliciting chrome binary from env", os.environ['CHROME'])
        o.binary_location = os.environ['CHROME']
except Exception as e:
    pass

# There is the possibility to use firefox instead of chrome, or to pass the extension via driver,
# but actually wasn't working yet, so we opt for sharing a pre-configured --user-data-dir

# firefox_profile=profile,
# log_path=os.path.join(profInfo['path'], 'driver.log'),
# driver.install_addon(
#   os.path.abspath(os.path.join("..", "extension", "dist", "extension.zip"))
# , temporary=True )

driver = Chrome(options=o)
driver.set_page_load_timeout(40)

with open(sys.argv[-1]) as cfg:
    urls = cfg.readlines();
    urlNumber = 1;
    for url in urls:
        print("Opening", url);
        openVideo(url, driver, urlNumber);
        urlNumber += 1;
    print("Test completed: closing");
    driver.close();
