FROM node:16.20.2-alpine

WORKDIR /var/opt/app

COPY package.json /var/opt/app

RUN npm install

COPY . /var/opt/app

EXPOSE 8180

CMD [ "npm", "run", "serve" ]
