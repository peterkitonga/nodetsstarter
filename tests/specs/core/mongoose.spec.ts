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
});
