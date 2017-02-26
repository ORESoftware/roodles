#!/usr/bin/env bash

cd $(dirname "$0")

NPM_ROOT=$(npm root)

if [[ -z ${NPM_ROOT} ]]; then
 echo "NPM_ROOT is not defined" && exit 1;
fi

if [[ ! -L ${NPM_ROOT}/.bin/roodles ]]; then
 echo "project is not symlinked to itself yet, let's do that now";
 npm link . &&
 npm link roodles || { echo "could not symlink 'roodles' project";  exit 1; }
 echo "symlinked project sucessfully";
else
 echo "project has already been symlinked, which is good!";
fi

./node_modules/.bin/suman