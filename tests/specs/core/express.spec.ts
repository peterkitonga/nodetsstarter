import path from 'path';
import cors from 'cors';
import express from 'express';
import { Container } from 'typedi';

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';
import { publicPath } from '@src/utils/path';

jest.mock('cors');
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
});
