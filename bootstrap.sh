#!/usr/bin/env bash

#Adds MongoDB 3.0 repos
MONGO_REPO="/etc/apt/sources.list.d/mongodb-org-3.0.list"
if [ ! -f $MONGO_REPO ]; then
	apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
	echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee $MONGO_REPO
fi

apt-get -y update

apt-get install -y curl
apt-get install -y git

# https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories
# Node.js v0.12
curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
sudo apt-get install -y nodejs

# # io.js
# curl -sL https://deb.nodesource.com/setup_iojs_1.x | sudo bash -
# sudo apt-get install -y iojs

sudo apt-get install -y mongodb-org

npm install -g bower
npm install -g gulp

DIRECTORY="/home/vagrant/.meteor"
if [ ! -d $DIRECTORY ]; then
	curl https://install.meteor.com/ | sh
fi