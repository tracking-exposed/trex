from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
import os, sys, time, re, errno

def getPName(srcstr):
    profileName = re.sub(r'\..*', '', os.path.basename(srcstr) )
    if not len(profileName):
        print("Error in picking profile name from", sys.argv, "[", srcstr, "] using '_NONAME' ")
        profileName = '_NONAME'
    return profileName

def createProfile(cfgname):
    profilePath = os.path.abspath(os.path.join("profiles", getPName(sys.argv[-1])))
    profileName = getPName(sys.argv[-1])
    if not os.path.exists(profilePath):
        print("You should copy the master directory in", profilePath)
        sys.exit(-1)
    else:
        print("Profile directory found!", profileName)
    profInfo = {}
    profInfo['name'] = profileName
    profInfo['path'] = profilePath
    return profInfo


def initialize(configName):
    if not os.path.exists(configName):
        print("Not found mandatory configuration file")
        sys.exit(1)

    profInfo = createProfile(configName)

    o = Options()
    o.add_argument('--user-data-dir=' + profInfo['path'])
    o.add_argument("--dns-prefetch-disable")
    o.add_argument("--start-maximized")
    o.add_argument("--disable-infobars")
    o.add_experimental_option("excludeSwitches", ['enable-automation'])

    try:
        if(os.environ['CHROME']):
            print("Expliciting chrome binary from env", os.environ['CHROME'])
            o.binary_location = os.environ['CHROME']
    except Exception as e:
        pass

    driver = Chrome(chrome_options=o)
    driver.set_page_load_timeout(30)

    return driver
