import { Container } from 'typedi';

import PasswordReset from '@src/models/password-reset';
import PasswordResetRepository from '@src/repositories/password-reset';
import { PasswordResetModel } from '@src/shared/interfaces/database';

describe('src/repositories/password-reset', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('create()', () => {
    describe('success', () => {
      it('should create a password reset with the provided details', async () => {
        const newPasswordReset = {
          email: 'user@test.com',
          token: 'SAMPLE_TOKEN',
        };
        const mockPasswordResetSave = jest.fn().mockResolvedValueOnce({
          ...newPasswordReset,
          _id: '123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        PasswordReset.prototype.save = mockPasswordResetSave;

        await Container.get(PasswordResetRepository).create(newPasswordReset);

        expect(mockPasswordResetSave).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors when saving a new password reset', async () => {
        const newPasswordReset = {
          email: 'user@test.com',
          token: 'SAMPLE_TOKEN',
        };

        PasswordReset.prototype.save = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_PASSWORD_RESET_ERROR'));

        await expect(Container.get(PasswordResetRepository).create(newPasswordReset)).rejects.toHaveProperty('message', 'SAMPLE_PASSWORD_RESET_ERROR');
      });
    });
  });

  describe('update()', () => {
    describe('success', () => {
      it('should be truthy', async () => {
        const response = await Container.get(PasswordResetRepository).update('_id', '123456', {} as PasswordResetModel);

        expect(response).toBeTruthy();
      });
    });
  });

  describe('delete()', () => {
    describe('success', () => {
      it('should delete a password reset with the provided identifier', async () => {
        const existingEmail = 'user@test.com';
        const mockPasswordResetDelete = jest.fn().mockResolvedValueOnce({
          _id: '123456',
        });

        PasswordReset.deleteOne = mockPasswordResetDelete;

        await Container.get(PasswordResetRepository).delete('email', existingEmail);

        expect(mockPasswordResetDelete).toHaveBeenCalledWith({ email: existingEmail });
      });
    });

    describe('error', () => {
      it('should catch errors when deleting a password reset with the provided identifier', async () => {
        const existingEmail = 'user@test.com';

        PasswordReset.deleteOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_PASSWORD_RESET_ERROR'));

        await expect(Container.get(PasswordResetRepository).delete('email', existingEmail)).rejects.toHaveProperty('message', 'SAMPLE_PASSWORD_RESET_ERROR');
      });
    });
  });

  describe('findByToken()', () => {
    describe('success', () => {
      it('should find a password reset with the provided token', async () => {
        const existingToken = 'SAMPLE_TOKEN';
        const mockPasswordResetFind = jest.fn().mockResolvedValueOnce({
          _id: '123456',
          email: 'user@test.com',
          token: existingToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        PasswordReset.findOne = mockPasswordResetFind;

        await Container.get(PasswordResetRepository).findByToken(existingToken);

        expect(mockPasswordResetFind).toHaveBeenCalledWith({ token: existingToken });
      });
    });

    describe('error', () => {
      it('should catch errors when fetching a password reset with the provided token', async () => {
        const existingToken = 'SAMPLE_TOKEN';

        PasswordReset.findOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_PASSWORD_RESET_ERROR'));

        await expect(Container.get(PasswordResetRepository).findByToken(existingToken)).rejects.toHaveProperty('message', 'SAMPLE_PASSWORD_RESET_ERROR');
      });
    });
  });
});
