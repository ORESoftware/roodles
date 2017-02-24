#!/usr/bin/env bash

cd $(dirname "$0")
./@build.sh &&
npm link . &&
npm link roodles