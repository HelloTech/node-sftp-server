FROM node:6.9.4
MAINTAINER hellotech

WORKDIR /usr/src/app/

RUN npm install

COPY . /usr/src/app

EXPOSE 8022

CMD ["node", "server.js"]