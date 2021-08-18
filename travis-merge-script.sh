#!/bin/bash

if [ "$TRAVIS_BRANCH" != "develop" ]; then
    exit 0
    echo "Skipping merge from $TRAVIS_BRANCH..."
else
    echo "Configure git credentials..."
    export GIT_COMMITTER_EMAIL="$GITHUB_EMAIL"
    export GIT_COMMITTER_NAME="peterkitonga"

    echo "Fetch refspecs for other branches..."
    git config --add remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
    git fetch origin

    echo "Checkout to master and merge..."
    git checkout master
    git merge --no-ff -m "Merge pull request #${TRAVIS_PULL_REQUEST} from peterkitonga/${TRAVIS_BRANCH}" "$TRAVIS_BRANCH"

    echo "Push merged changes..."
    git push "https://${GITHUB_TOKEN}@github.com/peterkitonga/nodetsstarter.git"
fi