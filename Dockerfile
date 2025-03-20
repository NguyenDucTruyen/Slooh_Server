FROM node:alpine

# Cài OpenSSL 3 thay vì OpenSSL 1.1
RUN apk add --no-cache openssl openssl-dev

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000
