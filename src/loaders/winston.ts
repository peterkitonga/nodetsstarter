import { createLogger, format, Logger, transports } from 'winston';

import configs from '../configs';
import { storagePath } from '../utils/path';

export default class WinstonLogger {
  private static logger: Logger = createLogger({
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

  public constructor() {
    // constructor
  }

  private static checkProduction() {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
      );
    }
  }

  public static info(message: string): void {
    this.checkProduction();
    this.logger.info(message);
  }

  public static error(message: string): void {
    this.checkProduction();
    this.logger.error(message);
  }
}
