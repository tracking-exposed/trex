FROM node:14-slim as build

WORKDIR /app

COPY ./tsconfig.json ./
COPY ./shared ./shared
COPY ./backend ./backend
COPY ./YCAI ./YCAI


WORKDIR /app/shared
RUN npm install
RUN npm run build

WORKDIR /app/backend
RUN npm install


WORKDIR /app/YCAI
RUN npm install
RUN npm run build

CMD ["npm", "run", "watch"]
