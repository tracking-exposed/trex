#!/usr/bin/env bash

# Shared
export shared=./packages/shared
echo $shared
cloc $shared --exclude-dir node_modules

# Taboule
export taboule=./packages/taboule
echo $taboule
cloc $taboule --exclude-dir node_modules

# TK TrEx Shared
export tktrex_shared=./platforms/tktrex/shared
echo $tktrex_shared
cloc $tktrex_shared --exclude-dir node_modules

# TK TrEx Ext
export tktrex_ext=./platforms/tktrex/extension
echo $tktrex_ext
cloc $tktrex_ext --exclude-dir node_modules

# TK TrEx Backend
export tktrex_backend=./platforms/tktrex/backend
echo $tktrex_backend
cloc $tktrex_backend --exclude-dir node_modules

# YT TrEx Shared
export yttrex_shared=./platforms/yttrex/shared/src
echo $yttrex_shared
cloc $yttrex_shared --exclude-dir node_modules

# YT TrEx Ext
export yttrex_ext=./platforms/yttrex/extension
echo $yttrex_ext
cloc $yttrex_ext --exclude-dir node_modules

# YT TrEx Backend
export yttrex_backend=./platforms/yttrex/backend
echo $yttrex_backend
cloc $yttrex_backend --exclude-dir node_modules
