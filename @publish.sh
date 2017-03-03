#!/usr/bin/env bash

cd $(dirname "$0")
timestamp=$(date +%s)

git add . &&
git add -A &&
git commit --allow-empty -am "set:$timestamp" &&
npm version patch -f &&
git push &&
echo "project PUSHED successfully" &&
npm publish . &&
echo "project PUBLISHED successfully"