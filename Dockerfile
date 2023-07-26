FROM node:14.21.3-alpine

WORKDIR /var/opt/app

COPY package.json /var/opt/app

RUN npm install

COPY .env.example /var/opt/app/.env

COPY . /var/opt/app

EXPOSE 8080

CMD [ "npm", "run", "serve" ]
