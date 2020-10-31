#!/bin/sh

#source $NVM_DIR/nvm.sh
#nvm use
export PATH=$PATH:$(npm bin)
ts-node service/index.ts
