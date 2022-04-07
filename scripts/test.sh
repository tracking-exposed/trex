#!/usr/bin/env bash

set -e -x

export DEBUG="@trex*"
export NODE_ENV=development
export DOTENV_CONFIG_PATH=.env.development

# build shared
yarn shared build

# build yt backend
yarn yt:backend build

# bootstrap yttrex backend processes
yarn pm2 start ./platforms/yttrex/backend/ecosystem.config.js

# test backend
# yarn yt:backend test

# build yttrex extension
yarn yt:ext build
rm -rf ./platforms/yttrex/extension/dist
cp -r ./platforms/yttrex/extension/build/ ./platforms/yttrex/extension/dist

# build the extension for production for guardoni
# yarn yt:ext dist
# yarn yt:ext test

# build guardoni
yarn guardoni build
# yarn guardoni pkg

# register an experiment for home
home_experiment_register_out="$(yarn guardoni cli yt-register ./experiments/yt-home.csv | grep 'experimentId:')"
home_experiment_id=${home_experiment_register_out/'experimentId: '/''}

# # exec the experiment
home_experiment_run_out=$(yarn guardoni cli yt-experiment -c guardoni.config.json $home_experiment_id |  grep 'publicKey:')
home_experiment_public_key=${home_experiment_run_out/'publicKey: '/''}
echo $home_experiment_public_key

curl "http://localhost:9000/api/v1/personal/$home_experiment_public_key"


# register an experiment for videos
video_experiment_register_out="$(yarn guardoni cli yt-register ./experiments/trex-yt-videos.csv | grep 'experimentId:')"
video_experiment_id=${video_experiment_register_out/'experimentId: '/''}

echo $video_experiment_id

# exec the experiment
video_experiment_run_out=$(yarn guardoni cli yt-experiment -c guardoni.config.json $video_experiment_id |  grep 'publicKey:')
video_experiment_public_key=${video_experiment_run_out/'publicKey: '/''}
echo $video_experiment_public_key

curl "http://localhost:9000/api/v1/personal/$video_experiment_public_key"

yarn pm2 stop all
