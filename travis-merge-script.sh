#!/bin/bash
set -u

if [ "$TRAVIS_PULL_REQUEST_BRANCH" != "develop" ]; then
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
    git merge --no-ff -m "Merge pull request #${TRAVIS_PULL_REQUEST} from peterkitonga/${TRAVIS_PULL_REQUEST_BRANCH}" "$TRAVIS_PULL_REQUEST_SHA"

    echo "Pushing merged changes to ${TRAVIS_REPO_SLUG}..."
    git push "https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" >/dev/null 2>&1
fi