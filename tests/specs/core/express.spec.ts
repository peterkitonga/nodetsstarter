import 'reflect-metadata';
import { Container } from 'typedi';

jest.mock('../../../src/core/winston');
jest.mock('../../../src/core/mongoose');

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import MongooseConnect from '@src/core/mongoose';

describe('src/core/express.ts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDatabase()', () => {
    it('should log success message after successful connection', () => {
      const sampleSuccessMessage = 'SUCCESS MESSAGE';
      const mockWinstonInfo = jest.fn().mockReturnValueOnce(null);
      const mockMongooseConnect = jest.fn().mockResolvedValue({
        message: sampleSuccessMessage,
      });

      Container.set(WinstonLogger, {
        info: mockWinstonInfo,
      });
      Container.set(MongooseConnect, {
        connect: mockMongooseConnect,
      });

      const ExpressAppInstance = Container.get(ExpressApp);
      const WinstonLoggerInstance = Container.get(WinstonLogger);
      const MongooseConnectInstance = Container.get(MongooseConnect);

      ExpressAppInstance.listen = jest.fn().mockReturnValueOnce(null);
      ExpressAppInstance.connectDatabase();

      expect(MongooseConnectInstance.connect).toHaveBeenCalled();
      expect(WinstonLoggerInstance.info).toBeCalledWith(sampleSuccessMessage);
    });
  });
});
