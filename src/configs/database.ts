import { connect } from 'mongoose';
import { ConnectionResponse } from '../interfaces/database';

const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_PORT = process.env.MONGO_PORT;
const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_DATABASE = process.env.MONGO_DATABASE;

let mongodbUri: string;

if (process.env.MONGO_PROVIDER === 'atlas') {
  mongodbUri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`;
} else {
  mongodbUri = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;
}

export const mongoConnect = (): Promise<ConnectionResponse> => {
  return new Promise((resolve, reject) => {
    connect(mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
      .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
      .catch((err) => reject({ status: 'error', message: err.message }));
  });
};
