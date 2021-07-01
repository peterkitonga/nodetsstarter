import winston from 'winston';

import configs from '../configs';

export const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new winston.transports.Console({ level: 'error' }),
    new winston.transports.File({
      filename: 'combined.log',
      level: configs.logging.level,
    }),
  ],
});
