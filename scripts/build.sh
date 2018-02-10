#!/bin/bash

# A simplified version of https://github.com/cloudflare/cf-ui/blob/master/scripts/build.sh

WATCH=''
if [[ $1 == '--watch' ]]; then
  WATCH='--watch'
fi

for package in packages/*; do
  ./node_modules/.bin/babel $WATCH "$package/src/" \
                            --source-maps \
                            --copy-files \
                            --ignore node_modules,spec,__tests__ \
                            --out-dir "$package/lib"
done
