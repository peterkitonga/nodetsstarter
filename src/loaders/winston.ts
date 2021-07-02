import { createLogger, format, Logger, transports } from 'winston';

import configs from '../configs';
import { storagePath } from '../utils/path';

export default class WinstonLogger {
  private static instance: WinstonLogger;
  private level: string = configs.logging.level;
  private logger: Logger;

  private constructor() {
    this.logger = createLogger({
      level: this.level,
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
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
      );
    }
  }

  public static init(): WinstonLogger {
    if (!this.instance) {
      this.instance = new WinstonLogger();
    }

    return this.instance;
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }
}
