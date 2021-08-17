#!/bin/bash

if [ "$TRAVIS_BRANCH" != "develop" ]; then
    exit 0
else
    export GIT_COMMITTER_EMAIL="$GITHUB_EMAIL"
    export GIT_COMMITTER_NAME="peterkitonga"

    git remote remove origin
    git remote set-url origin "https://$GITHUB_TOKEN@github.com/peterkitonga/nodetsstarter.git"

    git fetch origin
    git checkout master
    git merge --no-ff -m "Merge pull request #$TRAVIS_PULL_REQUEST from peterkitonga/$TRAVIS_BRANCH" "$TRAVIS_COMMIT"
    git push origin master
fi
