import { createLogger, format, transports } from 'winston';

import { storagePath } from '../utils/path';

import configs from '../configs';

export const logger = createLogger({
  level: configs.logging.level,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: storagePath('logs/error.log'), level: 'error' }),
    new transports.File({ filename: storagePath('logs/combined.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}
