FROM node:18-slim

RUN apt-get update && apt-get install -y openssl

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

COPY .env .env 

RUN npx prisma generate

EXPOSE 3000

CMD ["yarn", "dev"]
