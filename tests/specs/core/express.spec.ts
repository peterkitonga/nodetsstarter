import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { Container } from 'typedi';
import cookieParser from 'cookie-parser';

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';
import { publicPath } from '@src/utils/path';

jest.mock('cors');
jest.mock('helmet');
jest.mock('cookie-parser');
jest.mock('../../../src/api/routes');
jest.mock('express', () => {
  return require('jest-express');
});

describe('src/core/express.ts', () => {
  const flushPromises = () => new Promise(process.nextTick);

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('connectDatabase()', () => {
    describe('success', () => {
      it('should log message after connecting to mongo', async () => {
        const sampleSuccessMessage = 'SUCCESS MESSAGE';

        Container.set(WinstonLogger, {
          info: jest.fn(),
        });
        Container.set(MongooseConnect, {
          connect: jest.fn().mockResolvedValueOnce({
            message: sampleSuccessMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const WinstonLoggerInstance = Container.get(WinstonLogger);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.listen = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(WinstonLoggerInstance.info).toHaveBeenCalledWith(sampleSuccessMessage);
      });

      it('should start the application after connecting to mongo', async () => {
        const sampleSuccessMessage = 'SUCCESS MESSAGE';

        Container.set(WinstonLogger, {
          info: jest.fn(),
        });
        Container.set(MongooseConnect, {
          connect: jest.fn().mockResolvedValueOnce({
            message: sampleSuccessMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.listen = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(ExpressAppInstance.listen).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should log error message when connecting mongo fails', async () => {
        const sampleErrorMessage = 'ERROR MESSAGE';

        Container.set(WinstonLogger, {
          error: jest.fn(),
        });
        Container.set(MongooseConnect, {
          connect: jest.fn().mockRejectedValueOnce({
            message: sampleErrorMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const WinstonLoggerInstance = Container.get(WinstonLogger);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.disconnectDatabase = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(WinstonLoggerInstance.error).toHaveBeenCalledWith(`MONGO ERROR! ${sampleErrorMessage}`);
      });

      it('should disconnect mongo when connection fails', async () => {
        const sampleErrorMessage = 'ERROR MESSAGE';

        Container.set(WinstonLogger, {
          error: jest.fn(),
        });
        Container.set(MongooseConnect, {
          connect: jest.fn().mockRejectedValueOnce({
            message: sampleErrorMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.disconnectDatabase = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(ExpressAppInstance.disconnectDatabase).toHaveBeenCalled();
      });
    });
  });

  describe('disconnectDatabase()', () => {
    describe('success', () => {
      it('should log message after disconnecting mongo', async () => {
        const sampleSuccessMessage = 'SUCCESS MONGO MESSAGE';

        Container.set(WinstonLogger, {
          info: jest.fn(),
        });
        Container.set(MongooseConnect, {
          disconnect: jest.fn().mockResolvedValueOnce({
            message: sampleSuccessMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const WinstonLoggerInstance = Container.get(WinstonLogger);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.disconnectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.disconnect).toHaveBeenCalled();
        expect(WinstonLoggerInstance.info).toHaveBeenCalledWith(sampleSuccessMessage);
      });
    });

    describe('error', () => {
      it('should log message if disconnecting from mongo fails', async () => {
        const sampleErrorMessage = 'ERROR MONGO MESSAGE';

        Container.set(WinstonLogger, {
          error: jest.fn(),
        });
        Container.set(MongooseConnect, {
          disconnect: jest.fn().mockRejectedValueOnce({
            message: sampleErrorMessage,
          }),
        });

        const ExpressAppInstance = Container.get(ExpressApp);
        const WinstonLoggerInstance = Container.get(WinstonLogger);
        const MongooseConnectInstance = Container.get(MongooseConnect);

        ExpressAppInstance.disconnectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.disconnect).toHaveBeenCalled();
        expect(WinstonLoggerInstance.error).toHaveBeenCalledWith(sampleErrorMessage);
      });
    });
  });

  describe('listen()', () => {
    it('should setup the application server', () => {
      Container.set(WinstonLogger, {
        info: jest.fn(),
      });

      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.listen();

      expect(ExpressAppInstance['app'].listen).toHaveBeenCalled();
    });

    it('should log message after the application server starts', () => {
      const mockWinstonInfo = jest.fn();
      Container.set(WinstonLogger, {
        info: mockWinstonInfo,
      });

      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.listen();

      expect(mockWinstonInfo).toHaveBeenCalled();
    });

    it('should trigger graceful shutdown on process SIGTERM', () => {
      jest.useFakeTimers();

      const processEvents = {} as { [key: string]: (...args: any[]) => void };

      // @ts-ignore
      jest.spyOn(process, 'on').mockImplementation((signal: string | symbol, cb: (...args: any[]) => void) => {
        processEvents[signal as string] = cb;
      });

      // @ts-ignore
      jest.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number) => {
        return processEvents[signal!]();
      });

      const mockWinstonInfo = jest.fn();
      Container.set(WinstonLogger, {
        info: mockWinstonInfo,
      });

      const ExpressAppInstance = Container.get(ExpressApp);
      ExpressAppInstance.gracefulShutdown = jest.fn();
      ExpressAppInstance.listen();

      process.kill(process.pid, 'SIGTERM');

      jest.runAllTimers();

      expect(mockWinstonInfo).toHaveBeenCalled();
      expect(ExpressAppInstance.gracefulShutdown).toHaveBeenCalled();
    });

    it('should trigger graceful shutdown on process SIGINT', () => {
      jest.useFakeTimers();

      const processEvents = {} as { [key: string]: (...args: any[]) => void };

      // @ts-ignore
      jest.spyOn(process, 'on').mockImplementation((signal: string | symbol, cb: (...args: any[]) => void) => {
        processEvents[signal as string] = cb;
      });

      // @ts-ignore
      jest.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number) => {
        return processEvents[signal!]();
      });

      const mockWinstonInfo = jest.fn();
      Container.set(WinstonLogger, {
        info: mockWinstonInfo,
      });

      const ExpressAppInstance = Container.get(ExpressApp);
      ExpressAppInstance.gracefulShutdown = jest.fn();
      ExpressAppInstance.listen();

      process.kill(process.pid, 'SIGINT');

      jest.runAllTimers();

      expect(mockWinstonInfo).toHaveBeenCalled();
      expect(ExpressAppInstance.gracefulShutdown).toHaveBeenCalled();
    });
  });

  describe('serveStaticFiles()', () => {
    it('should fetch static files from the public folder', () => {
      const mockPathJoin = jest.spyOn(path, 'join');
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.serveStaticFiles();

      expect(mockPathJoin).toHaveBeenCalled();
      expect(mockPathJoin.mock.calls.pop()).toContain('../../public');
    });

    it('should pass static files from the public folder to express', () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.serveStaticFiles();

      expect(express.static).toHaveBeenCalledWith(publicPath());
      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('setupCors()', () => {
    it('should setup CORS rules', () => {
      const mockCors = jest.mocked(cors);
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.setupCors();

      expect(mockCors).toHaveBeenCalled();
      expect(mockCors.mock.calls[0].pop()).toEqual({
        origin: process.env.APP_ALLOWED_ORIGINS!.split(','),
        credentials: true,
        preflightContinue: true,
        exposedHeaders: ['Set-Cookie'],
      });
      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('setupHelmet()', () => {
    it('should setup helmet', () => {
      const mockHelmet = jest.mocked(helmet);
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.setupHelmet();

      expect(mockHelmet).toHaveBeenCalled();
      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('setupBodyParser()', () => {
    it('should setup the body parser to JSON', () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.setupBodyParser();

      expect(express.json).toHaveBeenCalled();
      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('setupCookieParser()', () => {
    it('should setup the cookie parser', () => {
      const mockCookieParser = jest.mocked(cookieParser);
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.setupCookieParser();

      expect(mockCookieParser).toHaveBeenCalled();
      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('handleHomeRoute()', () => {
    it('should setup a GET route for "/"', () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.handleHomeRoute();

      expect(ExpressAppInstance['app'].get).toHaveBeenCalled();
      expect((ExpressAppInstance['app'].get as jest.Mock).mock.calls.pop()).toContain('/');
    });
  });

  describe('handleAppRoutes()', () => {
    it('should setup routes with prefix "/api/v1"', () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.handleAppRoutes();

      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
      expect((ExpressAppInstance['app'].use as jest.Mock).mock.calls.pop()).toContain('/api/v1');
    });
  });

  describe('handleNonExistingRoute()', () => {
    it('should setup a middleware for none existing routes', async () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.handleNonExistingRoute();

      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('handleErrorMiddleware()', () => {
    it('should setup a middleware for API error responses', async () => {
      Container.set(WinstonLogger, {
        error: jest.fn(),
      });
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.handleErrorMiddleware();

      expect(ExpressAppInstance['app'].use).toHaveBeenCalled();
    });
  });

  describe('gracefulShutdown()', () => {
    it('should close the server', async () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      // @ts-ignore
      ExpressAppInstance['server'] = { close: jest.fn() };
      ExpressAppInstance.gracefulShutdown();

      expect(ExpressAppInstance['server']!.close).toHaveBeenCalled();
    });
  });

  describe('init()', () => {
    it('should initialize all custom middlewares', async () => {
      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.setupBodyParser = jest.fn();
      ExpressAppInstance.serveStaticFiles = jest.fn();
      ExpressAppInstance.setupCors = jest.fn();
      ExpressAppInstance.setupHelmet = jest.fn();
      ExpressAppInstance.setupCookieParser = jest.fn();
      ExpressAppInstance.handleHomeRoute = jest.fn();
      ExpressAppInstance.handleAppRoutes = jest.fn();
      ExpressAppInstance.handleNonExistingRoute = jest.fn();
      ExpressAppInstance.handleErrorMiddleware = jest.fn();
      ExpressAppInstance.connectDatabase = jest.fn();

      ExpressAppInstance.init();

      expect(ExpressAppInstance.setupBodyParser).toHaveBeenCalled();
      expect(ExpressAppInstance.serveStaticFiles).toHaveBeenCalled();
      expect(ExpressAppInstance.setupCors).toHaveBeenCalled();
      expect(ExpressAppInstance.setupHelmet).toHaveBeenCalled();
      expect(ExpressAppInstance.setupCookieParser).toHaveBeenCalled();
      expect(ExpressAppInstance.handleHomeRoute).toHaveBeenCalled();
      expect(ExpressAppInstance.handleAppRoutes).toHaveBeenCalled();
      expect(ExpressAppInstance.handleNonExistingRoute).toHaveBeenCalled();
      expect(ExpressAppInstance.handleErrorMiddleware).toHaveBeenCalled();
      expect(ExpressAppInstance.connectDatabase).toHaveBeenCalled();
    });
  });
});
