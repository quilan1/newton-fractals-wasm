#!/bin/sh

set -e

MODE=$1

if [ -z $MODE ]; then
    echo "This script should be called by the docker environment"
    exit -1;
fi

if [ "$MODE" = "rust" ]; then
    cargo install wasm-pack
    wasm-pack build --release;
else
    cd www
    corepack enable pnpm
    pnpm i
    pnpm build
    pnpm start;
fi
