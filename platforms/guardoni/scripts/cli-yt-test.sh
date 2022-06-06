#!/usr/bin/env bash

set -e -x

version=$(grep version package.json | cut -b 15- | sed -es/\".*//)

# yarn pm2 start --env test platforms/yttrex/backend/ecosystem.config.js
# sleep 5

#!/usr/bin/env bash

set -ex

export DEBUG="@trex*"
export NODE_ENV=development
export DOTENV_CONFIG_PATH=.env.development

version=$(grep version package.json | cut -b 15- | sed -es/\".*//)

# YT

# register an experiment for home
yt_home_experiment_register_out="$(./dist/guardoni-cli-$version-linux --verbose --basePath ./ -c "guardoni.config.json"  yt-register ./experiments/yt-home.csv | grep 'experimentId:')"
yt_home_experiment_id=${yt_home_experiment_register_out/'experimentId: '/''}
echo $yt_home_experiment_id

# # exec the experiment
yt_home_experiment_run_out=$(./dist/guardoni-cli-$version-linux --verbose --headless --basePath ./ -c "guardoni.config.json" yt-experiment $yt_home_experiment_id |  grep 'publicKey:')
yt_home_experiment_public_key=${yt_home_experiment_run_out/'publicKey: '/''}
echo $yt_home_experiment_public_key
# echo "http://localhost:14000/api/v1/personal/$yt_home_experiment_public_key"
# curl "http://localhost:9000/api/v1/personal/$yt_home_experiment_public_key"

#register an experiment for videos
yt_video_experiment_register_out="$(./dist/guardoni-cli-$version-linux --verbose --basePath ./ yt-register ./experiments/yt-videos.csv | grep 'experimentId:')"
yt_video_experiment_id=${yt_video_experiment_register_out/'experimentId: '/''}

# echo $yt_video_experiment_id

# exec the experiment
yt_video_experiment_run_out=$(./dist/guardoni-cli-$version-linux --verbose --headless --basePath ./ yt-experiment $yt_video_experiment_id |  grep 'publicKey:')
yt_video_experiment_public_key=${yt_video_experiment_run_out/'publicKey: '/''}
echo $yt_video_experiment_public_key
