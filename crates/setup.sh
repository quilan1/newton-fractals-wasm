#!/bin/sh

set -e

PKG=../frontend/src/pkg
#OPT=--profiling
OPT=--release

cargo install wasm-pack
wasm-pack build -t bundler -d ../$PKG $OPT newton_wasm;
