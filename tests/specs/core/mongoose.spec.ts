import { Container } from 'typedi';
import mongoose from 'mongoose';

import MongooseConnect from '@src/core/mongoose';
import configs from '@src/configs';

describe('src/core/mongoose', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('connect()', () => {
    describe('success', () => {
      it('should connect to atlas', async () => {
        configs.database.provider = 'atlas';

        const mockMongooseConnect = (mongoose.connect = jest.fn().mockResolvedValueOnce({}));
        const MongooseConnectInstance = Container.get(MongooseConnect);

        await MongooseConnectInstance.connect();

        expect(mockMongooseConnect).toHaveBeenCalled();
        expect(mockMongooseConnect.mock.calls.pop()![0]).toContain('mongodb+srv://test:password@example/database');
      });

      it('should connect to local setups', async () => {
        configs.database.provider = 'local';

        const mockMongooseConnect = (mongoose.connect = jest.fn().mockResolvedValueOnce({}));
        const MongooseConnectInstance = Container.get(MongooseConnect);

        await MongooseConnectInstance.connect();

        expect(mockMongooseConnect).toHaveBeenCalled();
        expect(mockMongooseConnect.mock.calls.pop()![0]).toContain('mongodb://test:password@example:10000/database');
      });

      it('should return a response with a message', async () => {
        mongoose.connect = jest.fn().mockResolvedValueOnce({});

        const MongooseConnectInstance = Container.get(MongooseConnect);

        const response = await MongooseConnectInstance.connect();

        expect(response).toHaveProperty('message', 'MONGO CONNECTED!');
      });
    });

    describe('error', () => {
      it('should catch errors from the mongodb connection', async () => {
        mongoose.connect = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_CONNECTION_ERROR'));

        const MongooseConnectInstance = Container.get(MongooseConnect);

        await expect(MongooseConnectInstance.connect()).rejects.toHaveProperty('message', 'SAMPLE_CONNECTION_ERROR');
      });
    });
  });

  describe('disconnect()', () => {
    describe('success', () => {
      it('should close the connection to mongodb', async () => {
        const mockMongooseConnectionClose = (mongoose.connection.close = jest.fn().mockResolvedValueOnce({}));
        const MongooseConnectInstance = Container.get(MongooseConnect);

        await MongooseConnectInstance.disconnect();

        expect(mockMongooseConnectionClose).toHaveBeenCalled();
        expect(mockMongooseConnectionClose.mock.calls.pop()![0]).toBeFalsy();
      });

      it('should return a response with a message', async () => {
        mongoose.connection.close = jest.fn().mockResolvedValueOnce({});
        const MongooseConnectInstance = Container.get(MongooseConnect);

        const response = await MongooseConnectInstance.disconnect();

        expect(response).toHaveProperty('message', 'MONGO DISCONNECTED!');
      });
    });

    describe('error', () => {
      it('should catch errors when disconnecting from mongodb', async () => {
        mongoose.connection.close = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_DISCONNECT_ERROR'));

        const MongooseConnectInstance = Container.get(MongooseConnect);

        await expect(MongooseConnectInstance.disconnect()).rejects.toHaveProperty('message', 'SAMPLE_DISCONNECT_ERROR');
      });
    });
  });
});
