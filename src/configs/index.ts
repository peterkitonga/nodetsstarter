import path from 'path';
import { accessSync } from 'fs';

import app from './app';
import mail from './mail';
import logging from './logging';
import database from './database';
import filesystems from './filesystems';

const envCheck = () => {
  try {
    const envPath = path.join(__dirname, '../../.env');
    accessSync(envPath);
  } catch (err) {
    throw new Error('Could not find .env file');
  }
};

envCheck();

export default {
  app,
  mail,
  logging,
  database,
  filesystems,
};
