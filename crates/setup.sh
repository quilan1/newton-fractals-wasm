#!/bin/sh

set -e
set +x

PKG=../frontend/src/pkg
#OPT=--profiling
OPT=--release

CMD=$1

if [ "$CMD" = "install-wasm" ]; then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

wasm-pack build -t bundler -d ../$PKG $OPT newton_wasm;
