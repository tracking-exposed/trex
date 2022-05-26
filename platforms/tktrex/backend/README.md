# TK - Backend

Requirements:

- mongodb should run and be reachable via localhost
- node should be at the latest version
- npm install
- npm run watch

This is only the backend system, as for the frontend, you should check: [tracking-exposed/tiktok.tracking.exposed](https://github.com/tracking-exposed/tiktok.tracking.exposed)

### How to use count-o-clock from crontab

```sh
1 * *  *   *  cd platforms/tktrex/backend/; DEBUG=* node bin/count-o-clock.js --hoursago 1 2>&1| tee -a /tmp/count-o-clock.log
```

How to repeat executions that have been missed

```sh
cd platforms/tktrex/backend$
$ for x in `seq 0 400`; do node bin/count-o-clock.js --hoursago $x ; done
```

this for example go back in the last 400 hours to recompute stats. It is necessary to run it every time config/trexstats.json get updated with new instruction
