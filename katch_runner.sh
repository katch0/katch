#!/bin/bash

node -r ts-node/register/transpile-only --nolazy --inspect katch.ts "$*"

