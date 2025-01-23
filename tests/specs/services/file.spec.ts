import path from 'path';
import { readFileSync } from 'fs';
import { Container } from 'typedi';
import fsPromises from 'fs/promises';

import configs from '@src/configs';
import SThreeClient from '@src/core/aws-sthree';
import FileStorageService from '@src/services/file';

describe('src/services/file', () => {
  const fileName = `${Date.now()}.jpeg`;
  const fileUrl = `https://example.com/path/${fileName}`;
  const rawFileData = readFileSync(path.resolve(__dirname, '../../dummy-file.json'), 'utf-8');
  const fileContent = JSON.parse(rawFileData).image as string;

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('storeFile()', () => {
    describe('success', () => {
      it('should store file to local storage disk if configured provider is "local"', async () => {
        const mockWriteFile = jest.spyOn(fsPromises, 'writeFile').mockResolvedValueOnce();
        const mockSymlink = jest.spyOn(fsPromises, 'symlink').mockResolvedValueOnce();

        configs.filesystems.provider = 'local';
        Container.set(SThreeClient, {});

        await Container.get(FileStorageService).storeFile(fileContent);

        expect(mockWriteFile).toHaveBeenCalled();
        expect(mockSymlink).toHaveBeenCalled();
      });

      it('should store file to cloud storage if configured provider is not "local"', async () => {
        const mockSaveToBucket = jest.fn().mockResolvedValueOnce({ message: 'SAMPLE_MESSAGE' });

        configs.filesystems.provider = 's3';
        Container.set(SThreeClient, {
          saveToBucket: mockSaveToBucket,
        });

        await Container.get(FileStorageService).storeFile(fileContent);

        expect(mockSaveToBucket).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors when storing files to the local storage disk', async () => {
        jest.spyOn(fsPromises, 'writeFile').mockRejectedValueOnce(new Error('SAMPLE_WRITE_FILE_ERROR'));
        jest.spyOn(fsPromises, 'symlink').mockResolvedValueOnce();

        configs.filesystems.provider = 'local';
        Container.set(SThreeClient, {});

        await expect(Container.get(FileStorageService).storeFile(fileContent)).rejects.toHaveProperty('message', 'SAMPLE_WRITE_FILE_ERROR');
      });

      it('should catch errors when storing files to the cloud storage', async () => {
        configs.filesystems.provider = 's3';
        Container.set(SThreeClient, {
          saveToBucket: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_S3_ERROR')),
        });

        await expect(Container.get(FileStorageService).storeFile(fileContent)).rejects.toHaveProperty('message', 'SAMPLE_S3_ERROR');
      });
    });
  });

  describe('deleteFile()', () => {
    describe('success', () => {
      it('should delete file from the local storage disk if configured provider is "local"', async () => {
        const mockUnlink = jest.spyOn(fsPromises, 'unlink').mockResolvedValue();

        configs.filesystems.provider = 'local';
        Container.set(SThreeClient, {});

        await Container.get(FileStorageService).deleteFile(fileUrl);

        expect(mockUnlink).toHaveBeenCalledTimes(2);
      });

      it('should delete file from the cloud storage if configured provider is not "local"', async () => {
        const mockDeleteFromBucket = jest.fn().mockResolvedValueOnce({ message: 'SAMPLE_MESSAGE' });

        configs.filesystems.provider = 's3';
        Container.set(SThreeClient, {
          deleteFromBucket: mockDeleteFromBucket,
        });

        await Container.get(FileStorageService).deleteFile(fileUrl);

        expect(mockDeleteFromBucket).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors when deleting files from the local storage disk', async () => {
        jest.spyOn(fsPromises, 'unlink').mockRejectedValueOnce(new Error('SAMPLE_UNLINK_ERROR'));

        configs.filesystems.provider = 'local';
        Container.set(SThreeClient, {});

        await expect(Container.get(FileStorageService).deleteFile(fileUrl)).rejects.toHaveProperty('message', 'SAMPLE_UNLINK_ERROR');
      });

      it('should catch errors when deleting files from the cloud storage', async () => {
        configs.filesystems.provider = 's3';
        Container.set(SThreeClient, {
          deleteFromBucket: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_S3_ERROR')),
        });

        await expect(Container.get(FileStorageService).deleteFile(fileUrl)).rejects.toHaveProperty('message', 'SAMPLE_S3_ERROR');
      });
    });
  });
});
