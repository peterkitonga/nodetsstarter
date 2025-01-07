import { Container } from 'typedi';

import Salt from '@src/models/salt';
import SaltRepository from '@src/repositories/salt';
import { SaltModel } from '@src/shared/interfaces/database';

describe('src/repositories/salt', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('create()', () => {
    describe('success', () => {
      it('should create a salt with the provided details', async () => {
        const newSalt = {
          salt: 'Test',
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
        };
        const mockSaltSave = jest.fn().mockResolvedValueOnce({
          ...newSalt,
          _id: '678910',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        Salt.prototype.save = mockSaltSave;

        await Container.get(SaltRepository).create(newSalt);

        expect(mockSaltSave).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors while creating a salt', async () => {
        const newSalt = {
          salt: 'Test',
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
        };

        Salt.prototype.save = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SALT_ERROR'));

        await expect(Container.get(SaltRepository).create(newSalt)).rejects.toHaveProperty('message', 'SAMPLE_SALT_ERROR');
      });
    });
  });

  describe('update()', () => {
    describe('success', () => {
      it('should be truthy', async () => {
        const response = await Container.get(SaltRepository).update('_id', '123456', {} as SaltModel);

        expect(response).toBeTruthy();
      });
    });
  });

  describe('delete()', () => {
    describe('success', () => {
      it('should delete one document', async () => {
        const existingSalt = 'SAMPLE_SALT';
        const mockSaltDelete = jest.fn().mockResolvedValueOnce({ _id: '678910' });

        Salt.deleteOne = mockSaltDelete;

        await Container.get(SaltRepository).delete('salt', existingSalt, 'one');

        expect(mockSaltDelete).toHaveBeenCalledWith({ salt: existingSalt });
      });

      it('should delete many documents', async () => {
        const existingSalt = 'SAMPLE_SALT';
        const mockSaltDelete = jest.fn().mockResolvedValueOnce({ deleteCount: 2 });

        Salt.deleteMany = mockSaltDelete;

        await Container.get(SaltRepository).delete('salt', existingSalt, 'many');

        expect(mockSaltDelete).toHaveBeenCalledWith({ salt: existingSalt });
      });
    });

    describe('error', () => {
      it('should catch errors when deleting a salt', async () => {
        const existingSalt = 'SAMPLE_SALT';

        Salt.deleteOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SALT_ERROR'));

        await expect(Container.get(SaltRepository).delete('salt', existingSalt, 'one')).rejects.toHaveProperty('message', 'SAMPLE_SALT_ERROR');
      });
    });
  });

  describe('findBySalt()', () => {
    describe('success', () => {
      it('should find a salt using the "salt" field', async () => {
        const existingSalt = 'SAMPLE_SALT';
        const mockSaltFind = jest.fn().mockResolvedValueOnce({ _id: '678910' });

        Salt.findOne = mockSaltFind;

        await Container.get(SaltRepository).findBySalt(existingSalt);

        expect(mockSaltFind).toHaveBeenCalledWith({ salt: existingSalt });
      });
    });

    describe('error', () => {
      it('should catch errors while fetching a salt', async () => {
        const existingSalt = 'SAMPLE_SALT';

        Salt.findOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SALT_ERROR'));

        await expect(Container.get(SaltRepository).findBySalt(existingSalt)).rejects.toHaveProperty('message', 'SAMPLE_SALT_ERROR');
      });
    });
  });

  describe('isValid()', () => {
    describe('success', () => {
      it('should check if the provided salt exists', async () => {
        const existingSalt = 'SAMPLE_SALT';
        const mockSaltExists = jest.fn().mockResolvedValueOnce({ _id: '678910' });

        Salt.exists = mockSaltExists;

        await Container.get(SaltRepository).isValid(existingSalt);

        expect(mockSaltExists).toHaveBeenCalledWith({ salt: existingSalt });
      });
    });

    describe('error', () => {
      it('should catch errors while fetching a salt', async () => {
        const existingSalt = 'SAMPLE_SALT';

        Salt.exists = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SALT_ERROR'));

        await expect(Container.get(SaltRepository).isValid(existingSalt)).rejects.toHaveProperty('message', 'SAMPLE_SALT_ERROR');
      });
    });
  });
});
