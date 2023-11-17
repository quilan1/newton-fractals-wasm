#!/bin/sh

set -e

cargo install wasm-pack
wasm-pack build -t bundler -d ../../frontend/src/pkg --release newton_core/;
