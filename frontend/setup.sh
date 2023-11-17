#!/bin/sh

set -e

corepack enable pnpm
pnpm i --config.confirmModulesPurge=false
pnpm build
pnpm start;
