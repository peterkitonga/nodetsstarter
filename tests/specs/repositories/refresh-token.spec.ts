import { Container } from 'typedi';

import RefreshToken from '@src/models/refresh-token';
import { RefreshTokenModel } from '@src/shared/interfaces/database';
import RefreshTokenRepository from '@src/repositories/refresh-token';

describe('src/repositories/refresh-token', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('create()', () => {
    describe('success', () => {
      it('should create a refresh token with the provided details', async () => {
        const newRefreshToken = {
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
          expiresAt: new Date().toISOString(),
        };
        const mockRefreshTokenSave = jest.fn().mockResolvedValueOnce({
          ...newRefreshToken,
          _id: '678910',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        RefreshToken.prototype.save = mockRefreshTokenSave;

        await Container.get(RefreshTokenRepository).create(newRefreshToken);

        expect(mockRefreshTokenSave).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors when saving a new refresh token', async () => {
        const newRefreshToken = {
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
          expiresAt: new Date().toISOString(),
        };

        RefreshToken.prototype.save = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_REFRESH_TOKEN_ERROR'));

        await expect(Container.get(RefreshTokenRepository).create(newRefreshToken)).rejects.toHaveProperty('message', 'SAMPLE_REFRESH_TOKEN_ERROR');
      });
    });
  });

  describe('update()', () => {
    describe('success', () => {
      it('should be truthy', async () => {
        const response = await Container.get(RefreshTokenRepository).update('_id', '123456', {} as RefreshTokenModel);

        expect(response).toBeTruthy();
      });
    });
  });

  describe('delete()', () => {
    describe('success', () => {
      it('should delete one refresh token document', async () => {
        const refreshTokenId = '123456';
        const mockRefreshTokenDelete = jest.fn().mockResolvedValueOnce({ _id: '123456' });

        RefreshToken.deleteOne = mockRefreshTokenDelete;

        await Container.get(RefreshTokenRepository).delete('_id', refreshTokenId, 'one');

        expect(mockRefreshTokenDelete).toHaveBeenCalledWith({ _id: refreshTokenId });
      });

      it('should delete many refresh token documents', async () => {
        const expiresAt = new Date().toISOString();
        const mockRefreshTokenDelete = jest.fn().mockResolvedValueOnce({ deleteCount: 2 });

        RefreshToken.deleteMany = mockRefreshTokenDelete;

        await Container.get(RefreshTokenRepository).delete('expiresAt', expiresAt, 'many');

        expect(mockRefreshTokenDelete).toHaveBeenCalledWith({ expiresAt: expiresAt });
      });
    });

    describe('error', () => {
      it('should catch errors when deleting a refresh token document', async () => {
        const refreshTokenId = '123456';

        RefreshToken.deleteOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_REFRESH_TOKEN_ERROR'));

        await expect(Container.get(RefreshTokenRepository).delete('_id', refreshTokenId, 'one')).rejects.toHaveProperty('message', 'SAMPLE_REFRESH_TOKEN_ERROR');
      });
    });
  });

  describe('findByIdAndDelete()', () => {
    describe('success', () => {
      it('should fetch the refresh token using the provided id', async () => {
        const refreshTokenId = '123456';
        const mockRefreshTokenFind = jest.fn().mockResolvedValueOnce({
          _id: '123456',
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
          expiresAt: new Date().toISOString(),
          deleteOne: jest.fn().mockResolvedValueOnce({ _id: '123456' }),
        });

        RefreshToken.findById = mockRefreshTokenFind;

        await Container.get(RefreshTokenRepository).findByIdAndDelete(refreshTokenId);

        expect(mockRefreshTokenFind).toHaveBeenCalledWith(refreshTokenId);
      });

      it('should delete the refresh token of the provided id', async () => {
        const refreshTokenId = '123456';
        const mockRefreshTokenDelete = jest.fn().mockResolvedValueOnce({ _id: '123456' });

        RefreshToken.findById = jest.fn().mockResolvedValueOnce({
          _id: '123456',
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
          expiresAt: new Date().toISOString(),
          deleteOne: mockRefreshTokenDelete,
        });

        await Container.get(RefreshTokenRepository).findByIdAndDelete(refreshTokenId);

        expect(mockRefreshTokenDelete).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors when deleting a new refresh token', async () => {
        const refreshTokenId = '123456';

        RefreshToken.findById = jest.fn().mockResolvedValueOnce({
          _id: '123456',
          user: {
            _id: '123456',
            name: 'Test',
            email: 'user@test.com',
            password: 'HASHED_PASSWORD',
            isActivated: false,
          },
          expiresAt: new Date().toISOString(),
          deleteOne: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_REFRESH_TOKEN_ERROR')),
        });

        await expect(Container.get(RefreshTokenRepository).findByIdAndDelete(refreshTokenId)).rejects.toHaveProperty('message', 'SAMPLE_REFRESH_TOKEN_ERROR');
      });
    });
  });
});
