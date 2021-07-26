import 'reflect-metadata';

import cors from 'cors';
import helmet from 'helmet';
import express, { Request, Response, NextFunction, Application, json } from 'express';

/* Note: Do not add modules above the configs module that require dotenv variables */
import configs from '../configs';
/* ============================= OTHER MODULES BELOW ============================= */

import routes from '../api/routes';
import WinstonLogger from './winston';
import MongooseConnect from './mongoose';
import { publicPath } from '../utils/path';
import BaseError from '../common/errors/base';
import { HttpStatusCodes } from '../common/enums/http';

export default class ExpressApp {
  private static instance: ExpressApp;
  private app: Application = express();

  private constructor() {
    this.setupBodyParser();
    this.serveStaticFiles();

    this.setupCors();
    this.setupHelmet();

    this.handleHomeRoute();
    this.handleAppRoutes();
    this.handleNonExistingRoute();
    this.handleErrorMiddleware();
    this.listen();
  }

  public static init(): ExpressApp {
    if (!this.instance) {
      this.instance = new ExpressApp();
    }

    return this.instance;
  }

  private async listen(): Promise<void> {
    try {
      const server = this.app.listen(configs.app.port);
      const { message } = await MongooseConnect.connect();
      const gracefulShutdown = () => {
        return server.close(async () => {
          const { message } = await MongooseConnect.disconnect();
          WinstonLogger.info('Server shutdown successfully!');
          WinstonLogger.info(message!);
        });
      };

      WinstonLogger.info(`Listening on: ${configs.app.base}, PID: ${process.pid}`);
      WinstonLogger.info(message!);

      process.on('SIGTERM', () => {
        WinstonLogger.info('Starting graceful shutdown of server...');
        gracefulShutdown();
      });

      process.on('SIGINT', () => {
        WinstonLogger.info('Exiting server process cleanly...');
        gracefulShutdown();
      });
    } catch (err) {
      WinstonLogger.error(err.message);
    }
  }

  private serveStaticFiles(): void {
    this.app.use(express.static(publicPath()));
  }

  private setupCors(): void {
    this.app.use(cors());
  }

  private setupHelmet(): void {
    this.app.use(helmet());
  }

  private setupBodyParser(): void {
    this.app.use(json());
  }

  private handleHomeRoute(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res
        .status(HttpStatusCodes.OK)
        .json({ message: `Hello There! Welcome to ${configs.app.name}`, version: configs.app.api.version });
    });
  }

  private handleAppRoutes(): void {
    this.app.use(configs.app.api.prefix(), routes());
  }

  private handleNonExistingRoute(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(HttpStatusCodes.NOT_FOUND).json({
        status: 'error',
        message: `Route: '${req.path}' not found`,
      });
    });
  }

  private handleErrorMiddleware(): void {
    this.app.use((err: BaseError, req: Request, res: Response, next: NextFunction) => {
      const { statusCode, message, data } = err;
      const code = statusCode || HttpStatusCodes.INTERNAL_SERVER;

      WinstonLogger.error(message);

      res.status(code).json({ status: 'error', message, data });
    });
  }
}
