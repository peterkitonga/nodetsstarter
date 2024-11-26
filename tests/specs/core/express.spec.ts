import path from 'path';
import cors from 'cors';
import express from 'express';
import { Container } from 'typedi';

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';

jest.mock('cors');

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
      const mockExpressStatic = jest.spyOn(express, 'static').mockReturnThis();

      express.prototype.use = jest.fn();

      const ExpressAppInstance = Container.get(ExpressApp);

      ExpressAppInstance.serveStaticFiles();

      const pathJoinArguments = mockPathJoin.mock.calls.pop();

      expect(mockExpressStatic).toHaveBeenCalled();
      expect(mockPathJoin).toHaveBeenCalled();
      expect(pathJoinArguments).toContain('../../public');
    });
  });
});
