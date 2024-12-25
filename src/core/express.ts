import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'http';
import { Service } from 'typedi';
import dotenvExp from 'dotenv-expand';
import cookieParser from 'cookie-parser';
import express, { Request, Response, NextFunction, Application, json } from 'express';

/* Note: Do not add modules above this line that require dotenv variables */
dotenvExp(dotenv.config({ path: path.join(__dirname, '../../.env') }));
/* ======================= OTHER MODULES GO BELOW ======================= */

import configs from '@src/configs';
import routes from '@src/api/routes';
import { publicPath } from '@src/utils/path';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';
import { HttpStatusCodes } from '@src/shared/enums';
import BaseError from '@src/shared/errors/base';

@Service()
export default class ExpressApp {
  private server?: Server;
  private app: Application = express();

  public constructor(private mongooseConnect: MongooseConnect, private winstonLogger: WinstonLogger) {
    //
  }

  public init(): void {
    this.setupBodyParser();
    this.serveStaticFiles();

    this.setupCors();
    this.setupHelmet();
    this.setupCookieParser();

    this.handleHomeRoute();
    this.handleAppRoutes();
    this.handleNonExistingRoute();
    this.handleErrorMiddleware();

    this.connectDatabase();
  }

  public connectDatabase(): void {
    this.mongooseConnect
      .connect()
      .then((res) => {
        this.winstonLogger.info(res.message!);
        this.listen();
      })
      .catch((err: Error) => {
        this.winstonLogger.error(`MONGO ERROR! ${err.message}`);
        this.disconnectDatabase();
      });
  }

  public disconnectDatabase(): void {
    this.mongooseConnect
      .disconnect()
      .then((res) => this.winstonLogger.info(res.message!))
      .catch((err: Error) => this.winstonLogger.error(err.message));
  }

  public listen(): void {
    this.server = this.app.listen(configs.app.port);

    this.winstonLogger.info(`Listening on: ${configs.app.base}, PID: ${process.pid}`);

    process.on('SIGTERM', () => {
      this.winstonLogger.info('Starting graceful shutdown of server...');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      this.winstonLogger.info('Exiting server process cleanly...');
      this.gracefulShutdown();
    });
  }

  public serveStaticFiles(): void {
    this.app.use(express.static(publicPath()));
  }

  public setupCors(): void {
    this.app.use(cors({ origin: process.env.APP_ALLOWED_ORIGINS!.split(','), credentials: true, preflightContinue: true, exposedHeaders: ['Set-Cookie'] }));
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
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(HttpStatusCodes.OK).json({ message: `Hello There! Welcome to ${configs.app.name}`, version: configs.app.api.version });
    });
  }

  public handleAppRoutes(): void {
    this.app.use(configs.app.api.prefix(), routes());
  }

  public handleNonExistingRoute(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(HttpStatusCodes.NOT_FOUND).json({
        message: `${req.method} route for '${req.path}' not found`,
      });
    });
  }

  public handleErrorMiddleware(): void {
    this.app.use((err: BaseError, _req: Request, res: Response, _next: NextFunction) => {
      let assignedStatusCode = HttpStatusCodes.INTERNAL_SERVER;
      const { statusCode, message, data, stack } = err;

      this.winstonLogger.error(message);
      this.winstonLogger.error(stack!);

      if (statusCode) {
        assignedStatusCode = statusCode;
      }

      res.status(assignedStatusCode).json({ message, data });
    });
  }

  public gracefulShutdown(): Server {
    return this.server!.close(() => {
      this.winstonLogger.info('Server shutdown successfully!');

      this.disconnectDatabase();
    });
  }
}
