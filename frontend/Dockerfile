FROM node:20-bullseye-slim

WORKDIR /code

COPY . /code/

RUN npm install

RUN npm run build

CMD ["npm", "start"]
