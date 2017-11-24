# Use latest node version 8.x
FROM node:8

MAINTAINER Mustafa Berberoglu <mustafaberberoglu@gmail.com>

# create app directory in container
RUN mkdir -p /app

# Install nodemon for live reload
RUN npm install nodemon -g

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
ADD package.json yarn.lock /app/

# --pure-lockfile: Don’t generate a yarn.lock lockfile
RUN yarn --pure-lockfile

# copy all file from current dir to /app in container

COPY .env.example .env
COPY . /app/

# expose port 8080
EXPOSE 8080

# cmd to start service
CMD yarn start:worker:all & yarn start:debug
