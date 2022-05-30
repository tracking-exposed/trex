FROM node:16-alpine
RUN mkdir /guardoni
WORKDIR /guardoni
RUN apk add python3
ADD . .
RUN npm install
RUN yarn tk:ext install
RUN yarn tk:ext clean
RUN yarn tk:ext build
