import { Container } from 'typedi';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import SThreeClient from '@src/core/aws-sthree';

describe('src/core/aws-sthree', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('saveToBucket()', () => {
    describe('success', () => {
      it('should send command to s3 using the sdk', async () => {
        const mockSThreeClientSend = (S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null));
        const SThreeClientInstance = Container.get(SThreeClient);

        await SThreeClientInstance.saveToBucket('NAME', 'image/jpg', Buffer.from('', 'base64'));

        expect(mockSThreeClientSend).toHaveBeenCalled();
      });

      it('should use the sdk put command', async () => {
        const mockSThreeClientSend = (S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null));
        const SThreeClientInstance = Container.get(SThreeClient);

        await SThreeClientInstance.saveToBucket('NAME', 'image/jpg', Buffer.from('', 'base64'));

        expect(mockSThreeClientSend.mock.calls.pop()![0]).toBeInstanceOf(PutObjectCommand);
      });

      it('should return a response with a message', async () => {
        S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null);
        const SThreeClientInstance = Container.get(SThreeClient);

        const response = await SThreeClientInstance.saveToBucket('NAME', 'image/jpg', Buffer.from('', 'base64'));

        expect(response).toHaveProperty('message', `Successfully uploaded 'NAME' to AWS S3 bucket 'SAMPLE_BUCKET_NAME'`);
      });
    });

    describe('error', () => {
      it('should catch errors from the s3 sdk', async () => {
        S3Client.prototype.send = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_BUCKET_ERROR'));
        const SThreeClientInstance = Container.get(SThreeClient);

        await expect(SThreeClientInstance.saveToBucket('NAME', 'image/jpg', Buffer.from('', 'base64'))).rejects.toHaveProperty('message', 'SAMPLE_BUCKET_ERROR');
      });
    });
  });

  describe('deleteFromBucket()', () => {
    describe('success', () => {
      it('should send command to s3 using the sdk', async () => {
        const mockSThreeClientSend = (S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null));
        const SThreeClientInstance = Container.get(SThreeClient);

        await SThreeClientInstance.deleteFromBucket('NAME');

        expect(mockSThreeClientSend).toHaveBeenCalled();
      });

      it('should use the sdk delete command', async () => {
        const mockSThreeClientSend = (S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null));
        const SThreeClientInstance = Container.get(SThreeClient);

        await SThreeClientInstance.deleteFromBucket('NAME');

        expect(mockSThreeClientSend.mock.calls.pop()![0]).toBeInstanceOf(DeleteObjectCommand);
      });

      it('should return a response with a message', async () => {
        S3Client.prototype.send = jest.fn().mockResolvedValueOnce(null);
        const SThreeClientInstance = Container.get(SThreeClient);

        const response = await SThreeClientInstance.deleteFromBucket('NAME');

        expect(response).toHaveProperty('message', `Successfully deleted 'NAME' from AWS S3 bucket 'SAMPLE_BUCKET_NAME'`);
      });
    });

    describe('error', () => {
      it('should catch errors from the s3 sdk', async () => {
        S3Client.prototype.send = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_BUCKET_ERROR'));
        const SThreeClientInstance = Container.get(SThreeClient);

        await expect(SThreeClientInstance.deleteFromBucket('NAME')).rejects.toHaveProperty('message', 'SAMPLE_BUCKET_ERROR');
      });
    });
  });
});
