#!/usr/bin/env bash

set -e -x

dev=$@

mkdir -p diagnostics/{shared,taboule,backend,guardoni,extension,ycai}

yarn shared tsc -b --diagnostics > diagnostics/shared/$dev.log
yarn taboule tsc -b --diagnostics > diagnostics/taboule/$dev.log
yarn backend tsc -b --diagnostics > diagnostics/backend/$dev.log
yarn extension tsc -b --diagnostics > diagnostics/extension/$dev.log
yarn guardoni tsc -b --diagnostics > diagnostics/guardoni/$dev.log
yarn ycai tsc -b --diagnostics > diagnostics/ycai/$dev.log

yarn clean
yarn tsc -b tsconfig.json --diagnostics > diagnostics/$dev-all.log
