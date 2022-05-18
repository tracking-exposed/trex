#!/usr/bin/env bash

# set -e -x
set -e

export DEBUG="@trex*"
export NODE_ENV=development
export DOTENV_CONFIG_PATH=.env.development

# bootstrap yttrex backend processes
yarn pm2 start ./platforms/yttrex/backend/ecosystem.config.js

sleep 5;

# YT

# register an experiment for home
yt_home_experiment_register_out="$(yarn guardoni cli --verbose --basePath ./ yt-register ./experiments/yt-home.csv | grep 'experimentId:')"
yt_home_experiment_id=${yt_home_experiment_register_out/'experimentId: '/''}
echo $yt_home_experiment_id

# # exec the experiment
yt_home_experiment_run_out=$(yarn guardoni cli --verbose --basePath ./ yt-experiment $yt_home_experiment_id |  grep 'publicKey:')
yt_home_experiment_public_key=${yt_home_experiment_run_out/'publicKey: '/''}
echo $yt_home_experiment_public_key
echo "http://localhost:14000/api/v1/personal/$yt_home_experiment_public_key"

# curl "http://localhost:9000/api/v1/personal/$yt_home_experiment_public_key"

# register an experiment for videos
yt_video_experiment_register_out="$(yarn guardoni cli --verbose --basePath ./ yt-register ./experiments/yt-videos.csv | grep 'experimentId:')"
yt_video_experiment_id=${yt_video_experiment_register_out/'experimentId: '/''}

echo $yt_video_experiment_id

# exec the experiment
yt_video_experiment_run_out=$(yarn guardoni cli --verbose --basePath ./ yt-experiment $yt_video_experiment_id |  grep 'publicKey:')
yt_video_experiment_public_key=${yt_video_experiment_run_out/'publicKey: '/''}
echo $yt_video_experiment_public_key

echo "Sleeping 30 seconds to let the parser process the data"
# otherwise I was getting only the first 'home' as processed
sleep 30;
# curl "http://localhost:9000/api/v1/personal/$video_experiment_public_key"

yarn pm2 stop yt-trex
