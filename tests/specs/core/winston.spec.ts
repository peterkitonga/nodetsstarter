import { Container } from 'typedi';
import winston from 'winston';

import configs from '@src/configs';
import WinstonLogger from '@src/core/winston';

describe('src/core/winston', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('info()', () => {
    it('should log messages in the console in development environments', () => {
      const mockWinstonAdd = jest.fn().mockReturnValue({});

      configs.app.env = 'development';
      winston.createLogger = jest.fn().mockImplementation(() => ({
        info: jest.fn().mockReturnValue({}),
        add: mockWinstonAdd,
      }));

      Container.get(WinstonLogger).info('SAMPLE_MESSAGE');

      expect(mockWinstonAdd).toHaveBeenCalled();
      expect(mockWinstonAdd.mock.calls.pop()![0]).toBeInstanceOf(winston.transports.Console);
    });

    it('should log messages in a log file in production environments', () => {
      const mockWinstonAdd = jest.fn().mockReturnValue({});

      configs.app.env = 'production';
      winston.createLogger = jest.fn().mockImplementation(() => ({
        info: jest.fn().mockReturnValue({}),
        add: mockWinstonAdd,
      }));

      Container.get(WinstonLogger).info('SAMPLE_MESSAGE');

      expect(mockWinstonAdd).toHaveBeenCalled();
      expect(mockWinstonAdd.mock.calls.pop()![0]).toBeInstanceOf(winston.transports.File);
    });

    it('should log messages using the info method', () => {
      const mockWinstonInfo = jest.fn().mockReturnValue({});

      winston.createLogger = jest.fn().mockImplementation(() => ({
        info: mockWinstonInfo,
        add: jest.fn(),
      }));

      Container.get(WinstonLogger).info('SAMPLE_MESSAGE');

      expect(mockWinstonInfo).toHaveBeenCalled();
    });
  });

  describe('error()', () => {
    it('should log messages using the error method', () => {
      const mockWinstonError = jest.fn().mockReturnValue({});

      winston.createLogger = jest.fn().mockImplementation(() => ({
        error: mockWinstonError,
        add: jest.fn(),
      }));

      Container.get(WinstonLogger).error('SAMPLE_MESSAGE');

      expect(mockWinstonError).toHaveBeenCalled();
    });
  });
});
