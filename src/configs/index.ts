import { access, constants } from 'fs';

import app from './app';
import mail from './mail';
import logging from './logging';
import database from './database';

const envPath = './.env';
access(envPath, constants.F_OK, (err) => {
  if (err) {
    throw new Error('Could not find .env file');
  }
});

export default {
  app,
  mail,
  database,
  logging,
};
