#!/usr/bin/env bash

export flags="--exclude-dir node_modules,build,__tests__,coverage --by-file-by-lang"
# Shared
export shared=./packages/shared/src
echo $shared
cloc $shared $flags

# Taboule
export taboule=./packages/taboule/src
echo $taboule
cloc $taboule $flags

# TK TrEx Shared
export tktrex_shared=./platforms/tktrex/shared/src
echo $tktrex_shared
cloc $tktrex_shared $flags

# TK TrEx Ext
export tktrex_ext=./platforms/tktrex/extension/src
echo $tktrex_ext
cloc $tktrex_ext $flags

# TK TrEx Backend
export tktrex_backend=./platforms/tktrex/backend
echo $tktrex_backend
cloc $tktrex_backend $flags

# YT TrEx Shared
export yttrex_shared=./platforms/yttrex/shared/src
echo $yttrex_shared
cloc $yttrex_shared $flags

# YT TrEx Ext
export yttrex_ext=./platforms/yttrex/extension/src
echo $yttrex_ext
cloc $yttrex_ext $flags

# YT TrEx Backend
export yttrex_backend=./platforms/yttrex/backend
echo $yttrex_backend
cloc $yttrex_backend $flags
