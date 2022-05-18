#!/usr/bin/env bash

# set -e -x
set -e

# TK

# register an experiment for home
search_experiment_register_out="$(yarn guardoni cli --verbose --basePath ./ -c guardoni.config.json tk-register ./experiments/tk-search.csv | grep 'experimentId:')"
search_experiment_id=${search_experiment_register_out/'experimentId: '/''}
echo $search_experiment_id

# # exec the experiment
search_experiment_run_out=$(yarn guardoni cli --verbose --basePath ./ tk-experiment $search_experiment_id |  grep 'publicKey:')
search_experiment_public_key=${search_experiment_run_out/'publicKey: '/''}
echo $search_experiment_public_key
echo "http://localhost:9000/api/v1/personal/$search_experiment_public_key"

# curl "http://localhost:9000/api/v1/personal/$home_experiment_public_key"


# # register an experiment for videos
# video_experiment_register_out="$(yarn guardoni cli --verbose --backend http://localhost:9000/api yt-register ./experiments/tk-videos.csv | grep 'experimentId:')"
# video_experiment_id=${video_experiment_register_out/'experimentId: '/''}

# echo $video_experiment_id

# # exec the experiment
# video_experiment_run_out=$(yarn guardoni cli --verbose --backend http://localhost:9000/api yt-experiment -c guardoni.config.json $video_experiment_id |  grep 'publicKey:')
# video_experiment_public_key=${video_experiment_run_out/'publicKey: '/''}
# echo $video_experiment_public_key

# echo "Sleeping 30 seconds to let the parser process the data"
# # otherwise I was getting only the first 'home' as processed
# sleep 30;
# # curl "http://localhost:9000/api/v1/personal/$video_experiment_public_key"


yarn pm2 stop all
