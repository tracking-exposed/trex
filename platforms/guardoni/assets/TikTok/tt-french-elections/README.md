# TikTok French Elections Monitoring Experiment

This type of experiment is designed to collect data from search queries on TikTok
in the context of the upcoming 2022 French presidential elections.

It will open chrome, browse the URL configured in `config.yaml` (set by default to tiktok.com/fr),
then type in the queries contained in `queries.csv` one by one in the search bar.

The script will press enter after each query, wait a bit then proceed to the next query.

While doing so, the collected data will be posted to tiktok.tracking.exposed.

## Settings

Feel free to explore this directory, the experiment is controlled
by the files in this directory:

- you can see and change the queries in `queries.csv`
- you can change the base platform URL in `config.yaml`.
- you can define a proxy server in `config.yaml`

## Running the experiment

Execute `yarn automate <path to this directory>` in the terminal.

Pay attention to the terminal messages, as the script might warn you that you need
to perform a manual action in the browser.

### First run

On the first run you will be asked to login on TikTok, please do so
and ask @djfm in case of difficulties or questions, there are some tricks.

Also accept the cookies and all.

**Remember** on the first run to open your TikTok personal page from the extension menu
to grab your public key and take note of it. It will come in handy later.

### Subsequent runs

Nothing special to do, just run the script again.

In case an action is required from you, you will be warned in the terminal.
