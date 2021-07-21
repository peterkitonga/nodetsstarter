import 'reflect-metadata';

import cors from 'cors';
import express, { Request, Response, NextFunction, Application, json } from 'express';

import configs from '../configs';
import WinstonLogger from './winston';
import MongooseConnect from './mongoose';
import { publicPath } from '../utils/path';
import { CustomError } from '../common/interfaces/errors';

export default class ExpressApp {
  private static instance: ExpressApp;
  private app: Application = express();

  private constructor() {
    this.setupBodyParser();
    this.serveStaticFiles();

    this.setupCors();

    this.handleHomeRoute();
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

      WinstonLogger.info(message!);

      process.on('SIGTERM', () => {
        WinstonLogger.info('Starting graceful shutdown of server...');
        server.close(function () {
          WinstonLogger.info('Server shutdown successfully!');
        });
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

  private setupBodyParser(): void {
    this.app.use(json());
  }

  private handleHomeRoute(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res
        .status(200)
        .json({ message: `Hello There! Welcome to ${configs.app.name}`, version: configs.app.api.version });
    });
  }

  private handleNonExistingRoute(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: `Route: '${req.path}' not found`,
      });
    });
  }

  private handleErrorMiddleware(): void {
    this.app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
      const { status_code, message, data } = err;
      const code = status_code || 500;

      WinstonLogger.error(message);

      res.status(code).json({ status: 'error', message, data });
    });
  }
}
