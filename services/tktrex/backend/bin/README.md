
###How to use count-o-clock from crontab

```
1 * *  *   *  cd yttrex/services/tktrex/backend/; DEBUG=* node bin/count-o-clock.js --hoursago 1 2>&1| tee -a /tmp/count-o-clock.log
```

How to repeat executions that have been missed

```
cd yttrex/services/tktrex/backend$ 
$ for x in `seq 0 400`; do node bin/count-o-clock.js --hoursago $x ; done
```

this for example go back in the last 400 hours to recompute stats. It is necessary to run it every time config/trexstats.json get updated with new instruction