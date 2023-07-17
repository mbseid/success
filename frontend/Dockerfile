from node:latest

WORKDIR /code

COPY . /code/

RUN npm install

RUN npm run build

CMD ["npm", "start"]
