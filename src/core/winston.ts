import { Service } from 'typedi';
import { createLogger, format, Logger, transports } from 'winston';

import configs from '@src/configs';
import { storagePath } from '@src/utils/path';

@Service()
export default class WinstonLogger {
  private logger: Logger;

  constructor() {
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
      transports: [new transports.File({ filename: storagePath('logs/error.log'), level: 'error' })],
    });
    this.extendTransports();
  }

  public extendTransports(): void {
    if (configs.app.env !== 'production') {
      this.logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }));
    } else {
      this.logger.add(new transports.File({ filename: storagePath('logs/combined.log') }));
    }
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }
}
