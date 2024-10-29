FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY index.js .
COPY utils.js .
COPY createDB.js .

CMD [ "node", "index.js" ]