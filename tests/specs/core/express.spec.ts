const mockWinstonInfo = jest.fn();
const mockWinstonError = jest.fn();

jest.mock('../../../src/core/winston', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return { info: mockWinstonInfo };
    }),
  };
});
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

      // jest.spyOn(WinstonLogger.prototype, 'info');
      jest.spyOn(MongooseConnect.prototype, 'connect').mockResolvedValue({
        message: sampleSuccessMessage,
      });
      jest.spyOn(ExpressApp.prototype, 'listen').mockReturnValueOnce();

      new ExpressApp(new MongooseConnect(), new WinstonLogger()).connectDatabase();

      expect(MongooseConnect.prototype.connect).toHaveBeenCalled();
      // expect(WinstonLogger.prototype.info).toHaveBeenCalled();
      expect(mockWinstonInfo).toBeCalledWith(sampleSuccessMessage);
    });
  });
});
