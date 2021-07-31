# NodeTS Starter 

<a href="https://travis-ci.com/PeterKitonga/nodetsstarter"><img alt="Build Status" src="https://img.shields.io/travis/com/PeterKitonga/nodetsstarter/master?style=for-the-badge"></a> <a href="https://coveralls.io/github/PeterKitonga/nodetsstarter"><img alt="Coverage Status" src="https://img.shields.io/coveralls/github/PeterKitonga/nodetsstarter/master?style=for-the-badge"></a>

This starter was created to serve as a starting template for a Node.js API built with Express and TypeScript.

## Features

- [TypeScript](https://www.typescriptlang.org/) - for type safety and other awesome features not native to vanilla JavaScript.
- [Express](https://expressjs.com/) - Micro-framework for setting up routes, middlewares, controllers.
- [Nodemailer](https://nodemailer.com/) - For all your mailing needs.
- [Mongoose](https://mongoosejs.com/) - ODM for connection to and querying of [MongoDB](https://www.mongodb.com/) collections.

## Roadmap

- [x] Database connection with mongoose
- [x] Linting with eslint and prettier
- [x] Mailing service with node mailer
- [x] Error handling
- [x] Logging for errors
- [x] Handle graceful shutdown of server
- [ ] Dependency injection for the service layer
- [x] API validation logic (joi)
- [x] Unit tests with mocha, chai
- [x] Continuous integration with TravisCI
- [x] Coverage reports with Coveralls
- [ ] Docker setup with docker-compose

## Environment Variables

To begin using the starter project, first copy the example variables into a .env file `cp .env.example .env`. You will need to modify the following environment variables in your .env file for your app to run:

`NODE_ENV` - production or development

`APP_PORT`

`APP_BASE_URL`

`APP_LOG_LEVEL`

`APP_LOCALE`

`APP_TIMEZONE`

`MONGO_PROVIDER` - local or atlas([MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

`MONGO_HOST` - if atlas, pass the domain provided after the `@` symbol when you click on `connect` > `Connect your application`

`CLIENT_BASE_URL` - base url for the front-end client application

Other configurations to change are all listed in the created .env file.

## Run Locally

Clone the project

```bash
  git clone https://github.com/PeterKitonga/nodetsstarter
```

Go to the project directory

```bash
  cd nodetsstarter
```

Install dependencies

```bash
  npm install
```

Start the development server

```bash
  npm run serve
```

## Deployment

Install dependencies first

```bash
  npm install
```

To deploy this project in production, run

```bash
  npm run build
```

## Running Tests

Tests are written in Mocha, Chai under the `test` directory and uses `istanbul` for coverage reports. To run tests, run the following command

```bash
  npm test
```

To run and view coverage reports for the tests, you will need to run two scripts in sequential order

```bash
  npm run test:coverage ; npm run test:view
```

## Linting

Linting is configured with eslint and prettier. You are free to configure it to your liking using the configuration files `.eslintrc` and `.prettierrc`

To check for linting errors, run

```bash
  npm run lint
```

To format code with linting rules, run

```bash
  npm run lint:format
```

## Authors

[@PeterKitonga](https://www.github.com/PeterKitonga)
