# How to build an user-data-dir

The best method to understand what this is about is thinking to a chrominum executed with option --user-data-dir (UDD)
The UDD allow your to run the browser without interfering with System Paths. All the activities, log, caches, extension, cookies, gets logged in the UDD.

## How to build an UDD

#### mkdir

The directory has to exist and be empty

#### first execution

Use the option --user-data-dir to point at the new created directory. To be sure that's worked: you should see zero history in your URL bar, zero bookmarks, no extension: just a basic unlogged chrome home page.

#### Do your setup

* **never access** to youtube.com
* got in chrome://settings and remove any automatical activity that interact with Google
* configure to start with a new tab and don't keep memory of open tab when closed
* install https://youtube.tracking.exposed extension
* Do you remember that you should never access to youtube.com? it is because once the extension see youtube.com, create a cryptographic key. You don't want yet this happen.
* Eventually install a new theme, a colorful yellow bright theme that visually would remind you "I'm running in that UDD"

#### Do the copies

* Now you've the "UNINITIALIZE PROFILE" or the "PARENT FROM WHICH PROFILES ARE BORN", either or.
