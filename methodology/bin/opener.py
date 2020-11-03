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


def openURL(url, driver):
    driver.get(url)
    cookie = driver.get_cookie('CONSENT')
    cookies = driver.get_cookies()
    print("this would be closed in 40 seconds", cookie, cookies)
    time.sleep(20)


if not os.path.exists(sys.path[-1]):
    print("Not found mandatory configuration file")
    sys.exit(1)

profInfo = createProfile(sys.path[-1])

o = Options()
o.add_argument('--user-data-dir=' + profInfo['path'])
o.add_argument("--dns-prefetch-disable")
o.add_argument("--start-maximized")

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

driver = Chrome(chrome_options=o)
driver.set_page_load_timeout(30)

with open(sys.argv[-1]) as cfg:
    urls = cfg.readlines();
    for url in urls:
        print("Opening page:", url);
        openURL(url, driver);
    print("Access completed!");
    driver.close();
