import { createLogger, format, Logger, transports } from 'winston';

import configs from '../configs';
import { storagePath } from '../utils/path';

class WinstonLogger {
  private logger: Logger;

  public constructor() {
    this.logger = createLogger({
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
        process.env.NODE_ENV !== 'production'
          ? new transports.Console({ format: format.combine(format.colorize(), format.simple()) })
          : new transports.File({ filename: storagePath('logs/combined.log') }),
      ],
    });
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }
}

export default new WinstonLogger();
