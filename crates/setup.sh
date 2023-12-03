#!/bin/sh

set -e
set +x

CMD=$1

PKG=../frontend/src/pkg
# OPT_LEVEL=--dev
# OPT_LEVEL=--profiling
OPT_LEVEL=--release
EXTRA_OPTS=--no-pack

install_wasm_pack() { curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh; }
# There's issues with the official twiggy cargo package, so you have to build it from source from github...
install_twiggy() { :; }
build_wasm() { wasm-pack build $OPTS newton_wasm; }
twiggy_debug() {
    # Just some debugging stuff locally, for making smaller WASM files
    WASM=$PKG/newton_wasm_bg.wasm
    TWIGGY=../../twiggy/target/release/twiggy.exe
    mkdir -p target/twiggy
    $TWIGGY top $WASM > target/twiggy/top.txt
    $TWIGGY monos $WASM > target/twiggy/monos.txt
    $TWIGGY dominators $WASM > target/twiggy/dom.txt
    $TWIGGY garbage $WASM > target/twiggy/garbage.txt
}

if [ "$CMD" = "install-wasm" ]; then install_wasm_pack; fi

OPTS="-d ../$PKG $OPT_LEVEL $EXTRA_OPTS"

build_wasm

if [ "$CMD" = "twiggy" ]; then twiggy_debug; fi
