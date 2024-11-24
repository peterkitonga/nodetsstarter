import { Container } from 'typedi';

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';

describe('src/core/express.ts', () => {
  const flushPromises = () => new Promise(process.nextTick);

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('connectDatabase()', () => {
    describe('success', () => {
      it('should log message after successful connection', async () => {
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

      it('should start the application after successful connection', async () => {
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
      it('should log error message when connection fails', async () => {
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

        ExpressAppInstance.gracefulShutdown = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(WinstonLoggerInstance.error).toHaveBeenCalledWith(`MONGO ERROR! ${sampleErrorMessage}`);
      });

      it('should perform graceful shutdown when connection fails', async () => {
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

        ExpressAppInstance.gracefulShutdown = jest.fn().mockReturnValueOnce(null);
        ExpressAppInstance.connectDatabase();

        await flushPromises();

        expect(MongooseConnectInstance.connect).toHaveBeenCalled();
        expect(ExpressAppInstance.gracefulShutdown).toHaveBeenCalled();
      });
    });
  });
});
