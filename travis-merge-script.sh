#!/bin/bash

if [ "$TRAVIS_BRANCH" != "develop" ]; then
    exit 0
else
    export GIT_COMMITTER_EMAIL="$GITHUB_EMAIL"
    export GIT_COMMITTER_NAME="peterkitonga"

    git config --add remote.origin.fetch +refs/heads/*:refs/remotes/origin/*

    git fetch --all
    git checkout master
    git merge --no-ff -m "Merge pull request #$TRAVIS_PULL_REQUEST from peterkitonga/$TRAVIS_BRANCH" "$TRAVIS_COMMIT"
    git push "https://$GITHUB_TOKEN@github.com/peterkitonga/nodetsstarter.git"
fi
