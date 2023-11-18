import path from 'path';
import { accessSync } from 'fs';

import app from '@src/configs/app';
import mail from '@src/configs/mail';
import logging from '@src/configs/logging';
import database from '@src/configs/database';
import filesystems from '@src/configs/filesystems';

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
