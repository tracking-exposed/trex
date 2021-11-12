FROM node:12-slim as deps

WORKDIR /app

COPY / ./

RUN npm install

CMD ["npm", "run", "watch"]