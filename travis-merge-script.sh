#!/bin/bash
set -u

if [ "$TRAVIS_BRANCH" != "develop" ]; then
    echo "Pull request ${TRAVIS_PULL_REQUEST}..."
    echo "Pull request branch ${TRAVIS_PULL_REQUEST_BRANCH}..."
    echo "Skipping merge from ${TRAVIS_BRANCH}..."
    exit 0
else
    echo "Configuring git credentials..."
    export GIT_COMMITTER_EMAIL="$GITHUB_EMAIL"
    export GIT_COMMITTER_NAME="peterkitonga"

    echo "Fetching refspecs for other branches..."
    git config --add remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
    git fetch --all

    echo "Checkout to master and merge..."
    git checkout master
    git merge --no-ff -m "Merge pull request #${TRAVIS_PULL_REQUEST} from peterkitonga/${TRAVIS_BRANCH}" "$TRAVIS_COMMIT"

    echo "Pushing merged changes..."
    git push "https://${GITHUB_TOKEN}@github.com/peterkitonga/nodetsstarter.git" >/dev/null 2>&1
fi