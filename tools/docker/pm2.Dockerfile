FROM keymetrics/pm2:16-alpine

WORKDIR /var/opt/app

COPY package.json /var/opt/app

RUN npm install

COPY . /var/opt/app

RUN npm run build

EXPOSE 8180

RUN ls -al -R

CMD [ "pm2-runtime", "start", "pm2.config.js" ]
