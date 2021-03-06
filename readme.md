<div align="center">
<h1>Node TS Starter</h1>
<a href="https://app.travis-ci.com/github/peterkitonga/nodetsstarter" target="_blank"><img alt="Build Status" src="https://img.shields.io/travis/com/peterkitonga/nodetsstarter/master?style=for-the-badge"></a> <a href="https://coveralls.io/github/peterkitonga/nodetsstarter" target="_blank"><img alt="Coverage Status" src="https://img.shields.io/coveralls/github/peterkitonga/nodetsstarter/master?style=for-the-badge"></a>
<p>This starter was created to serve as a starting template for a Node.js API built with Express and TypeScript.</p>
</div>

## Features

- [TypeScript](https://www.typescriptlang.org/) - For type safety and other awesome features not native to vanilla JavaScript.
- [Express](https://expressjs.com/) - Micro-framework for setting up routes, middlewares, controllers.
- [Nodemailer](https://nodemailer.com/) - For all your mailing needs.
- [Mongoose](https://mongoosejs.com/) - ODM for connection to and querying of [MongoDB](https://www.mongodb.com/) collections.
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started-nodejs.html) - For all your file storage needs. Requires an AWS account and S3 bucket.

## Roadmap

- [x] Database connection with mongoose
- [x] Linting with eslint and prettier
- [x] Mailing service with nodemailer
- [x] Error handling middleware
- [x] Logging setup for errors and data
- [x] Handle graceful shutdown of server
- [ ] Dependency injection for the service layer
- [x] API validation logic with joi
- [x] Unit tests with mocha, chai & sinon
- [x] Continuous integration with TravisCI
- [x] Coverage reports with istanbul & Coveralls
- [ ] Containerized setup with docker-compose

## Folder structure

    |-- public/                   # Static assets & symlinks for locally stored files
    |-- src/
    |   |-- @types/               # Configurations for declaration merging
    |   |-- api/
    |   |   |-- controllers/      # All REST API router functions
    |   |   |-- middlewares/      # Interceptor filters before router functions
    |   |   |-- routes/           # Routes for the REST API
    |   |-- common/               
    |   |   |-- abstracts/        # Custom abstract classes
    |   |   |-- decorators/       # Custom decorators
    |   |   |-- enums/            # Custom enum types
    |   |   |-- errors/           # Custom error classes with HTTP status codes
    |   |   |-- interfaces/       # Custom interface types
    |   |-- configs/              # Configurations retrieved from env variables
    |   |-- loaders/              # Modules split for easier startup of application
    |   |-- models/               # Mongoose models as data access layer
    |   |-- services/             # Main business logic code as service layer
    |   |-- utils/                # Local utility functions for application
    |   |-- app.ts                # Application main file
    |-- storage/                  # Local storage for cache, files and logs
    |-- test/                     # Specs for unit tests
    |-- views/                    # Templates for emails & pdf files(e.g. invoices)
    |-- .env.example              # Local environment config sample
    

## Environment Variables

To begin using the starter project, first copy the example variables into a `.env` file with command: `cp .env.example .env`. You will then need to modify the following environment variables in the `.env` file for your API to run:

- `APP_PORT`, `APP_BASE_URL`, `APP_LOG_LEVEL`, `APP_LOCALE`, `APP_TIMEZONE`

- `NODE_ENV` - `production` or `development`

- `MONGO_PROVIDER` - `local` or `atlas`([MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

- `MONGO_HOST` - if `atlas`, pass the domain provided after the `@` symbol when you click on `connect` > `Connect your application`

- `FILE_SYSTEM_PROVIDER` - `local` or `s3`([AWS S3](https://aws.amazon.com/s3))

- `FILE_SYSTEM_LIMIT` - maximum file size to be allowed. `Note: this affects the maximum request body size of Express`

- `CLIENT_BASE_URL` - base url for the front-end client application

Other configurable variables will all be listed in the created `.env` file.

## Run Locally

Clone the project

```bash
  git clone https://github.com/peterkitonga/nodetsstarter
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

[Peter Kitonga](https://www.github.com/peterkitonga)
