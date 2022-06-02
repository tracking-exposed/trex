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

# TK
echo  "Open the browser to login in tiktok"
# ./dist/guardoni-cli-$version.exe --verbose --basePath ./ tk-navigate

#register an experiment for search
tk_search_experiment_register_out="$(./dist/guardoni-cli-$version.exe --verbose --basePath ./ tk-register ./experiments/tk-search.csv | grep 'experimentId:')"
tk_search_experiment_id=${tk_search_experiment_register_out/'experimentId: '/''}

# echo $tk_search_experiment_id

# exec the experiment
tk_search_experiment_run_out=$(./dist/guardoni-cli-$version.exe --verbose --headless --basePath ./ tk-experiment $tk_search_experiment_id |  grep 'publicKey:')
tk_search_experiment_public_key=${tk_search_experiment_run_out/'publicKey: '/''}
echo $tk_search_experiment_public_key


#register an experiment for videos
tk_video_experiment_register_out="$(./dist/guardoni-cli-$version.exe --verbose --basePath ./ tk-register ./experiments/tk-videos.csv | grep 'experimentId:')"
tk_video_experiment_id=${tk_video_experiment_register_out/'experimentId: '/''}

# echo $tk_video_experiment_id

# exec the experiment
tk_video_experiment_run_out=$(./dist/guardoni-cli-$version.exe --verbose --headless --basePath ./ tk-experiment $tk_video_experiment_id |  grep 'publicKey:')
tk_video_experiment_public_key=${tk_video_experiment_run_out/'publicKey: '/''}
echo $tk_video_experiment_public_key
