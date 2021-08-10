import 'reflect-metadata';

import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import dotenvExpand from 'dotenv-expand';
import express, { Request, Response, NextFunction, Application, json } from 'express';

/* Note: Do not add modules above this line that require dotenv variables */
dotenvExpand(dotenv.config({ path: path.join(__dirname, '../../.env') }));
/* ======================= OTHER MODULES GO BELOW ======================= */

import configs from '../configs';
import routes from '../api/routes';
import WinstonLogger from './winston';
import MongooseConnect from './mongoose';
import { publicPath } from '../utils/path';
import BaseError from '../common/errors/base';
import { HttpStatusCodes } from '../common/enums/http';

class ExpressApp {
  private app: Application = express();

  public constructor() {
    //
  }

  public async init(): Promise<void> {
    this.setupBodyParser();
    this.serveStaticFiles();

    this.setupCors();
    this.setupHelmet();
    this.setupCookieParser();

    this.handleHomeRoute();
    this.handleAppRoutes();
    this.handleNonExistingRoute();
    this.handleErrorMiddleware();

    await this.connectDatabase();
    this.listen();
  }

  public listen(): void {
    const server = this.app.listen(configs.app.port);
    const gracefulShutdown = () => {
      return server.close(async () => {
        const { message } = await MongooseConnect.disconnect();
        WinstonLogger.info('Server shutdown successfully!');
        WinstonLogger.info(message!);
      });
    };

    WinstonLogger.info(`Listening on: ${configs.app.base}, PID: ${process.pid}`);

    process.on('SIGTERM', () => {
      WinstonLogger.info('Starting graceful shutdown of server...');
      gracefulShutdown();
    });

    process.on('SIGINT', () => {
      WinstonLogger.info('Exiting server process cleanly...');
      gracefulShutdown();
    });
  }

  public async connectDatabase(): Promise<void> {
    try {
      const { message } = await MongooseConnect.connect();

      WinstonLogger.info(message!);
    } catch (err) {
      WinstonLogger.error(err.message);
    }
  }

  public serveStaticFiles(): void {
    this.app.use(express.static(publicPath()));
  }

  public setupCors(): void {
    this.app.use(cors());
  }

  public setupHelmet(): void {
    this.app.use(helmet());
  }

  public setupBodyParser(): void {
    this.app.use(json({ limit: configs.filesystems.limit }));
  }

  public setupCookieParser(): void {
    this.app.use(cookieParser());
  }

  public handleHomeRoute(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res
        .status(HttpStatusCodes.OK)
        .json({ message: `Hello There! Welcome to ${configs.app.name}`, version: configs.app.api.version });
    });
  }

  public handleAppRoutes(): void {
    this.app.use(configs.app.api.prefix(), routes());
  }

  public handleNonExistingRoute(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(HttpStatusCodes.NOT_FOUND).json({
        status: 'error',
        message: `Route: '${req.path}' not found`,
      });
    });
  }

  public handleErrorMiddleware(): void {
    this.app.use((err: BaseError, req: Request, res: Response, next: NextFunction) => {
      const { statusCode, message, data } = err;
      const code = statusCode || HttpStatusCodes.INTERNAL_SERVER;

      WinstonLogger.error(message);

      res.status(code).json({ status: 'error', message, data });
    });
  }
}

export default new ExpressApp();
