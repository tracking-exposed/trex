
Please give a look at [automation page](https://youtube.tracking.exposed/automation).

1. to properly dispatch the profile, you should copy an un-initialized user-data-dir (please refer to the option --user-data-dir from chromium. On Firefox looks way too hard to use it).
2. we build an user-data-dir which is partially initialized: has settings that reduce the interaction with Google, have the browser extension installed but is not initialized yet (it generated the cryptographic material the first time it access to youtube.com)
3. The [uninitialized-user-data-dir](https://github.com/tracking-exposed/experiments-data/blob/master/yttrex/uninitialized-udd.tar.gz), or [direct 16.9 download](https://raw.githubusercontent.com/tracking-exposed/experiments-data/master/yttrex/uninitialized-udd.tar.gz), is there linked, and should be decompressed in `profiles`, then renamed with your **campaing name**.

### Quick requirement list

    pip3 install -U selenium

platform dependent:

    apt search chromedriver
    apt install firefox-geckodriver chromium-chromedriver

### Quick reminder on working flow

If you want to run a collection campaign, the exact order of command is:

1. have a copy from `profiles/unitinizalized-udd` to `profiles/thetestname`
2. have a file full or youtube URLs in: `config/thetestname.txt`, look for example at `config/example.txt`
3. execute `python3 bin/experiment1.py config/thetestname.txt`, this NEEDS to find a directory in `profiles/thetestname`, otherwise will display and error.
