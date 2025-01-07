import bcrypt from 'bcryptjs';
import { Container } from 'typedi';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

jest.mock('jsonwebtoken');

import configs from '@src/configs';
import AuthService from '@src/services/auth';
import UserRepository from '@src/repositories/user';
import SaltRepository from '@src/repositories/salt';
import RefreshTokenRepository from '@src/repositories/refresh-token';
import PasswordResetRepository from '@src/repositories/password-reset';
import { AuthRequest } from '@src/shared/interfaces/requests';

describe('src/services/auth', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('registerUser()', () => {
    describe('success', () => {
      it('should hash the provided password', async () => {
        const mockBcryptHash = jest.fn().mockResolvedValueOnce('SAMPLE_HASH');
        const newUser = { name: 'Test', email: 'user@test.com', password: 'password' };

        bcrypt.hash = mockBcryptHash;
        Container.set(UserRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '123456' }),
          isRegistered: jest.fn().mockResolvedValueOnce(null),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });

        await Container.get(AuthService).registerUser(newUser);

        expect(mockBcryptHash).toHaveBeenCalled();
        expect(mockBcryptHash.mock.calls.pop()![0]).toEqual('password');
      });

      it('should create the user if the email does not exist', async () => {
        const newUser = { name: 'Test', email: 'user@test.com', password: 'password' };
        const mockUserCreate = jest.fn().mockResolvedValueOnce({ _id: '123456' });
        const mockSaltCreate = jest.fn().mockResolvedValueOnce({});
        const mockUserIsRegistered = jest.fn().mockResolvedValueOnce(null);

        bcrypt.hash = jest.fn().mockResolvedValueOnce('SAMPLE_HASH');
        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_SALT');
        Container.set(UserRepository, {
          create: mockUserCreate,
          isRegistered: mockUserIsRegistered,
        });
        Container.set(SaltRepository, {
          create: mockSaltCreate,
        });

        await Container.get(AuthService).registerUser(newUser);

        expect(mockUserIsRegistered).toHaveBeenCalled();
        expect(mockUserCreate).toHaveBeenCalledWith({ ...newUser, password: 'SAMPLE_HASH', isActivated: false });
        expect(mockSaltCreate).toHaveBeenCalledWith({ salt: 'SAMPLE_SALT', user: '123456' });
      });

      it('should return data response with the generated salt', async () => {
        const newUser = { name: 'Test', email: 'user@test.com', password: 'password' };
        const mockUserCreate = jest.fn().mockResolvedValueOnce({ _id: '123456' });
        const mockUserIsRegistered = jest.fn().mockResolvedValueOnce(null);

        bcrypt.hash = jest.fn().mockResolvedValueOnce('SAMPLE_HASH');
        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_SALT');
        Container.set(UserRepository, {
          create: mockUserCreate,
          isRegistered: mockUserIsRegistered,
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });

        const response = await Container.get(AuthService).registerUser(newUser);

        expect(response).toMatchObject({ data: { salt: 'SAMPLE_SALT' } });
      });
    });

    describe('error', () => {
      it('should check if the user email exists before creation', async () => {
        const email = 'user@test.com';
        const newUser = { name: 'Test', email, password: 'password' };
        const mockUserIsRegistered = jest.fn().mockResolvedValueOnce({ _id: '123456' });

        Container.set(UserRepository, {
          isRegistered: mockUserIsRegistered,
        });

        await expect(Container.get(AuthService).registerUser(newUser)).rejects.toHaveProperty('message', `User with email '${email}' already exists.`);
        expect(mockUserIsRegistered).toHaveBeenCalledWith(email);
      });

      it('should catch errors during creation', async () => {
        const newUser = { name: 'Test', email: 'user@test.com', password: 'password' };
        const mockUserIsRegistered = jest.fn().mockResolvedValueOnce(null);

        Container.set(UserRepository, {
          create: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_ERROR')),
          isRegistered: mockUserIsRegistered,
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(Container.get(AuthService).registerUser(newUser)).rejects.toHaveProperty('message', 'SAMPLE_USER_ERROR');
      });
    });
  });

  describe('authenticateUser()', () => {
    describe('success', () => {
      it('should compare the provided clear text password with the stored hashed password', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };
        const mockBcryptCompare = jest.fn().mockResolvedValueOnce(true);

        bcrypt.compare = mockBcryptCompare;
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '7891011' }),
        });

        await Container.get(AuthService).authenticateUser(authUser);

        expect(mockBcryptCompare).toHaveBeenCalledWith(authUser.password, existingUser.password);
      });

      it('should create a salt for the generated tokens', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };
        const mockSaltCreate = jest.fn().mockResolvedValueOnce({});

        bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_SALT');
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: mockSaltCreate,
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '7891011' }),
        });

        await Container.get(AuthService).authenticateUser(authUser);

        expect(mockSaltCreate).toHaveBeenCalledWith({ salt: 'SAMPLE_SALT', user: existingUser._id });
      });

      it('should create an auth token & refresh token', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };
        const mockRefreshTokenCreate = jest.fn().mockResolvedValueOnce({ _id: '7891011' });
        const mockJwtSign = jest.fn().mockReturnValueOnce('SAMPLE_TOKEN');

        configs.app.auth.jwt.lifetime = '3600';
        bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_SALT');
        Date.prototype.toString = jest.fn().mockReturnValueOnce('Dec 30 2024 00:00:00');
        jwt.sign = mockJwtSign;
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });
        Container.set(RefreshTokenRepository, {
          create: mockRefreshTokenCreate,
        });

        await Container.get(AuthService).authenticateUser(authUser);

        expect(mockJwtSign).toHaveBeenCalledTimes(2);
        expect(mockRefreshTokenCreate).toHaveBeenCalledWith({ user: existingUser._id, expiresAt: 'Dec 30 2024 00:00:00' });
        expect(mockJwtSign.mock.calls[0][2]).toHaveProperty('expiresIn', 3600 * 24); // refresh token lifespan
        expect(mockJwtSign.mock.calls[1][2]).toHaveProperty('expiresIn', 3600); // auth token lifespan
      });

      it('should generate a refresh token with a longer lifespan if "rememberMe" is true', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: true };
        const mockJwtSign = jest.fn().mockReturnValueOnce('SAMPLE_TOKEN');

        jwt.sign = mockJwtSign;
        bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_SALT');
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '7891011' }),
        });

        await Container.get(AuthService).authenticateUser(authUser);

        expect(mockJwtSign).toHaveBeenCalledTimes(2);
        expect(mockJwtSign.mock.calls[0][2]).toHaveProperty('expiresIn', 3600 * 720);
      });
    });

    describe('error', () => {
      it('should return an error message if the user email does not exist', async () => {
        const authUser = { email: 'none-user@test.com', password: 'password', rememberMe: false };
        const mockUserFindEmail = jest.fn().mockResolvedValueOnce(null);

        Container.set(UserRepository, {
          findByEmail: mockUserFindEmail,
        });

        await expect(Container.get(AuthService).authenticateUser(authUser)).rejects.toHaveProperty('message', `User with email '${authUser.email}' does not exist.`);
        expect(mockUserFindEmail).toHaveBeenCalledWith(authUser.email);
      });

      it('should return an error message if the existing user is not activated', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: false,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };

        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });

        await expect(Container.get(AuthService).authenticateUser(authUser)).rejects.toHaveProperty('message', `User with email '${authUser.email}' is not activated yet.`);
      });

      it('should return an error message if the clear text password & hashed password do not match', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };

        bcrypt.compare = jest.fn().mockResolvedValueOnce(false);

        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });

        await expect(Container.get(AuthService).authenticateUser(authUser)).rejects.toHaveProperty('message', 'Unauthorised. User password entered is incorrect.');
      });

      it('should catch errors when creating refresh tokens', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };

        bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_REFRESH_TOKEN_ERROR')),
        });

        await expect(Container.get(AuthService).authenticateUser(authUser)).rejects.toHaveProperty('message', 'SAMPLE_REFRESH_TOKEN_ERROR');
      });

      it('should catch errors when generating tokens', async () => {
        const existingUser = {
          _id: '123456',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const authUser = { email: existingUser.email, password: 'password', rememberMe: false };

        bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
        jwt.sign = jest.fn().mockImplementationOnce(() => {
          throw new Error('SAMPLE_JWT_SIGN_ERROR');
        });
        Container.set(UserRepository, {
          findByEmail: jest.fn().mockResolvedValueOnce(existingUser),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '123456' }),
        });

        await expect(Container.get(AuthService).authenticateUser(authUser)).rejects.toHaveProperty('message', 'SAMPLE_JWT_SIGN_ERROR');
      });
    });
  });

  describe('activateUser()', () => {
    describe('success', () => {
      it('should update the user as activated & delete the related salt', async () => {
        const activationCode = '123456';
        const existingUser = {
          _id: '789101',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: false,
        };
        const mockUserSave = jest.fn().mockResolvedValueOnce({ ...existingUser, isActivated: true });
        const existingSalt = {
          _id: '123456',
          salt: 'SAMPLE_SALT',
          user: {
            ...existingUser,
            save: mockUserSave,
          },
        };
        const mockSaltDelete = jest.fn().mockResolvedValueOnce(true);

        Container.set(SaltRepository, {
          findBySalt: jest.fn().mockResolvedValueOnce(existingSalt),
          delete: mockSaltDelete,
        });

        await Container.get(AuthService).activateUser(activationCode);

        expect(mockUserSave).toHaveBeenCalled();
        expect(mockSaltDelete).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should return an error message if a salt does not exist with the activation code', async () => {
        const activationCode = '123456';
        const mockFindSalt = jest.fn().mockResolvedValueOnce(null);

        Container.set(SaltRepository, {
          findBySalt: mockFindSalt,
        });

        await expect(Container.get(AuthService).activateUser(activationCode)).rejects.toHaveProperty('message', `User with activation code '${activationCode}' does not exist.`);
      });

      it('should return an error message if existing user is already activated', async () => {
        const activationCode = '123456';
        const mockFindSalt = jest.fn().mockResolvedValueOnce({ user: { isActivated: true } });

        Container.set(SaltRepository, {
          findBySalt: mockFindSalt,
        });

        await expect(Container.get(AuthService).activateUser(activationCode)).rejects.toHaveProperty(
          'message',
          `User account with activation code '${activationCode}' is already activated.`,
        );
      });
    });
  });

  describe('createResetToken()', () => {
    describe('success', () => {
      it('should create a password reset token', async () => {
        const existingEmail = 'user@test.com';
        const mockPasswordResetCreate = jest.fn().mockResolvedValueOnce({});

        jest.spyOn(Buffer.prototype, 'toString').mockReturnValueOnce('SAMPLE_TOKEN');
        Container.set(UserRepository, {
          isRegistered: jest.fn().mockResolvedValueOnce({ _id: '123456' }),
        });
        Container.set(PasswordResetRepository, {
          create: mockPasswordResetCreate,
        });

        await Container.get(AuthService).createResetToken(existingEmail);

        expect(mockPasswordResetCreate).toHaveBeenCalledWith({ email: existingEmail, token: 'SAMPLE_TOKEN' });
      });
    });

    describe('error', () => {
      it('should return an error message if the email does not exist', async () => {
        const nonExistingEmail = 'none-user@test.com';
        const mockUserIsRegistered = jest.fn().mockResolvedValueOnce(null);

        Container.set(UserRepository, {
          isRegistered: mockUserIsRegistered,
        });

        await expect(Container.get(AuthService).createResetToken(nonExistingEmail)).rejects.toHaveProperty('message', `User with email '${nonExistingEmail}' does not exist.`);
        expect(mockUserIsRegistered).toHaveBeenCalledWith(nonExistingEmail);
      });
    });
  });

  describe('resetPassword()', () => {
    describe('success', () => {
      it('should create and store a hashed password', async () => {
        const resetPasswordRequest = { token: 'SAMPLE_TOKEN', password: 'password' };
        const mockUserUpdate = jest.fn().mockResolvedValueOnce({ _id: '123456' });
        const mockBcryptHash = jest.fn().mockResolvedValueOnce('SAMPLE_HASH');

        bcrypt.hash = mockBcryptHash;
        Container.set(UserRepository, {
          update: mockUserUpdate,
        });
        Container.set(PasswordResetRepository, {
          findByToken: jest.fn().mockResolvedValueOnce({ email: 'user@test.com' }),
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(SaltRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(RefreshTokenRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });

        await Container.get(AuthService).resetPassword(resetPasswordRequest);

        expect(mockUserUpdate).toHaveBeenCalled();
        expect(mockUserUpdate.mock.calls[0][2]).toMatchObject({ password: 'SAMPLE_HASH' });
        expect(mockBcryptHash).toHaveBeenCalledWith(resetPasswordRequest.password, 12);
      });

      it('should delete resources related to the password reset email', async () => {
        const resetPasswordUserId = '123456';
        const resetPasswordEmail = 'user@test.com';
        const resetPasswordRequest = { token: 'SAMPLE_TOKEN', password: 'password' };
        const mockPasswordResetDelete = jest.fn().mockResolvedValueOnce(true);
        const mockRefreshTokenDelete = jest.fn().mockResolvedValueOnce(true);
        const mockSaltDelete = jest.fn().mockResolvedValueOnce(true);

        bcrypt.hash = jest.fn().mockResolvedValueOnce('SAMPLE_HASH');
        Container.set(UserRepository, {
          update: jest.fn().mockResolvedValueOnce({ _id: resetPasswordUserId }),
        });
        Container.set(PasswordResetRepository, {
          findByToken: jest.fn().mockResolvedValueOnce({ email: resetPasswordEmail }),
          delete: mockPasswordResetDelete,
        });
        Container.set(SaltRepository, {
          delete: mockSaltDelete,
        });
        Container.set(RefreshTokenRepository, {
          delete: mockRefreshTokenDelete,
        });

        await Container.get(AuthService).resetPassword(resetPasswordRequest);

        expect(mockPasswordResetDelete).toHaveBeenCalledWith('email', resetPasswordEmail);
        expect(mockRefreshTokenDelete).toHaveBeenCalledWith('user', resetPasswordUserId, 'many');
        expect(mockSaltDelete).toHaveBeenCalledWith('user', resetPasswordUserId, 'many');
      });
    });

    describe('error', () => {
      it('should create and store a hashed password', async () => {
        const resetPasswordRequest = { token: 'SAMPLE_TOKEN', password: 'password' };

        Container.set(PasswordResetRepository, {
          findByToken: jest.fn().mockResolvedValueOnce(null),
        });

        await expect(Container.get(AuthService).resetPassword(resetPasswordRequest)).rejects.toHaveProperty(
          'message',
          `Password reset token '${resetPasswordRequest.token}' does not exist.`,
        );
      });
    });
  });

  describe('refreshToken()', () => {
    describe('success', () => {
      it('should decode & verify the provided token', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockJwtVerifyToken = jest.fn().mockReturnValueOnce({
          token: 'SAMPLE_TOKEN',
          duration: 84600,
          salt: 'SAMPLE_SALT',
        });

        jwt.verify = mockJwtVerifyToken;
        jwt.sign = jest.fn().mockReturnValueOnce('SAMPLE_TOKEN');
        configs.app.auth.jwt.secret = 'JWT_SECRET';
        Container.set(PasswordResetRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(SaltRepository, {
          create: jest.fn().mockResolvedValueOnce({}),
          isValid: jest.fn().mockResolvedValueOnce({ _id: '111213' }),
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '789101' }),
          findByIdAndDelete: jest.fn().mockResolvedValueOnce({
            user: {
              _id: '123456',
            },
          }),
        });

        await Container.get(AuthService).refreshToken(encryptedToken);

        expect(mockJwtVerifyToken).toHaveBeenCalledWith(encryptedToken, 'JWT_SECRET');
      });

      it('should check if the related salt is valid & delete existing refresh tokens', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockSaltDelete = jest.fn().mockResolvedValueOnce(true);
        const mockSaltIsValid = jest.fn().mockResolvedValueOnce({ _id: '111213' });
        const mockRefreshTokenDelete = jest.fn().mockResolvedValueOnce({
          user: {
            _id: '123456',
          },
        });

        jwt.verify = jest.fn().mockReturnValueOnce({
          token: 'SAMPLE_TOKEN',
          duration: 84600,
          salt: 'SAMPLE_SALT',
        });
        jwt.sign = jest.fn().mockReturnValueOnce('SAMPLE_TOKEN');
        configs.app.auth.jwt.secret = 'JWT_SECRET';
        Container.set(PasswordResetRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(SaltRepository, {
          isValid: mockSaltIsValid,
          create: jest.fn().mockResolvedValueOnce({}),
          delete: mockSaltDelete,
        });
        Container.set(RefreshTokenRepository, {
          create: jest.fn().mockResolvedValueOnce({ _id: '789101' }),
          findByIdAndDelete: mockRefreshTokenDelete,
        });

        await Container.get(AuthService).refreshToken(encryptedToken);

        expect(mockSaltDelete).toHaveBeenCalled();
        expect(mockSaltIsValid).toHaveBeenCalled();
        expect(mockRefreshTokenDelete).toHaveBeenCalled();
      });

      it('should create new refresh tokens', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockJwtSign = jest.fn().mockReturnValueOnce('SAMPLE_TOKEN');
        const mockRefreshTokenCreate = jest.fn().mockResolvedValueOnce({ _id: '789101' });

        jwt.verify = jest.fn().mockReturnValueOnce({
          token: 'SAMPLE_TOKEN',
          duration: 84600,
          salt: 'SAMPLE_SALT',
        });
        jwt.sign = mockJwtSign;
        configs.app.auth.jwt.secret = 'JWT_SECRET';
        Container.set(PasswordResetRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(SaltRepository, {
          isValid: jest.fn().mockResolvedValueOnce({ _id: '111213' }),
          create: jest.fn().mockResolvedValueOnce({}),
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(RefreshTokenRepository, {
          create: mockRefreshTokenCreate,
          findByIdAndDelete: jest.fn().mockResolvedValueOnce({
            user: {
              _id: '123456',
            },
          }),
        });

        await Container.get(AuthService).refreshToken(encryptedToken);

        expect(mockJwtSign).toHaveBeenCalledTimes(2);
        expect(mockRefreshTokenCreate).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should return error message if verifying the token fails', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockJwtVerifyToken = jest.fn().mockReturnValueOnce(null);

        jwt.verify = mockJwtVerifyToken;
        configs.app.auth.jwt.secret = 'JWT_SECRET';

        await expect(Container.get(AuthService).refreshToken(encryptedToken)).rejects.toHaveProperty('message', 'Authentication failed. Please login.');
        expect(mockJwtVerifyToken).toHaveBeenCalledWith(encryptedToken, 'JWT_SECRET');
      });

      it('should return error message if verifying the token fails', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockJwtVerifyToken = jest.fn().mockImplementation(() => {
          throw new TokenExpiredError('TOKEN_EXPIRED', new Date('January 02, 2025 00:00:00'));
        });

        jwt.verify = mockJwtVerifyToken;
        configs.app.auth.jwt.secret = 'JWT_SECRET';

        await expect(Container.get(AuthService).refreshToken(encryptedToken)).rejects.toHaveProperty('message', 'Unauthorized. Refresh token is expired.');
        expect(mockJwtVerifyToken).toHaveBeenCalledWith(encryptedToken, 'JWT_SECRET');
      });

      it('should return error message if the verified token has an invalid salt', async () => {
        const encryptedToken = 'SAMPLE_ENCRYPTED_TOKEN';
        const mockSaltIsValid = jest.fn().mockResolvedValueOnce(null);

        configs.app.auth.jwt.secret = 'JWT_SECRET';
        jwt.verify = jest.fn().mockReturnValueOnce({
          token: 'SAMPLE_TOKEN',
          duration: 84600,
          salt: 'SAMPLE_SALT',
        });
        Container.set(SaltRepository, {
          isValid: mockSaltIsValid,
        });

        await expect(Container.get(AuthService).refreshToken(encryptedToken)).rejects.toHaveProperty('message', 'Authentication failed. Please login.');
        expect(mockSaltIsValid).toHaveBeenCalledWith('SAMPLE_SALT');
      });
    });
  });

  describe('getUser()', () => {
    describe('success', () => {
      it('should return user details of the provided id', async () => {
        const userId = '123456';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const mockUserFind = jest.fn().mockResolvedValueOnce(existingUser);

        Container.set(UserRepository, {
          findById: mockUserFind,
        });

        const response = await Container.get(AuthService).getUser(userId);

        expect(mockUserFind).toHaveBeenCalled();
        expect(mockUserFind.mock.calls.pop()![0]).toEqual(userId);
        expect(response.data).toMatchObject(existingUser);
      });
    });

    describe('error', () => {
      it('should catch errors while fetching user details', async () => {
        const userId = '123456';

        Container.set(UserRepository, {
          findById: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_ERROR')),
        });

        await expect(Container.get(AuthService).getUser(userId)).rejects.toHaveProperty('message', 'SAMPLE_USER_ERROR');
      });
    });
  });

  describe('updateUser()', () => {
    describe('success', () => {
      it('should update user details with the provided id', async () => {
        const userId = '123456';
        const updateRequest = { name: 'Test', email: 'user@test.com' } as AuthRequest;
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const mockUserUpdate = jest.fn().mockResolvedValueOnce(existingUser);

        Container.set(UserRepository, {
          update: mockUserUpdate,
        });

        const response = await Container.get(AuthService).updateUser(userId, updateRequest);

        expect(mockUserUpdate).toHaveBeenCalled();
        expect(mockUserUpdate.mock.calls[0][1]).toEqual(userId);
        expect(mockUserUpdate.mock.calls[0][2]).toEqual(updateRequest);
        expect(response.data).toMatchObject(existingUser);
      });
    });

    describe('error', () => {
      it('should catch errors while updating user details', async () => {
        const userId = '123456';
        const updateRequest = { name: 'Test', email: 'user@test.com' } as AuthRequest;

        Container.set(UserRepository, {
          update: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_ERROR')),
        });

        await expect(Container.get(AuthService).updateUser(userId, updateRequest)).rejects.toHaveProperty('message', 'SAMPLE_USER_ERROR');
      });
    });
  });

  describe('updateAvatar()', () => {
    describe('success', () => {
      it('should update the user avatar with the provided id', async () => {
        const userId = '123456';
        const url = 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          avatar: url,
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const mockUserUpdate = jest.fn().mockResolvedValueOnce(existingUser);

        Container.set(UserRepository, {
          update: mockUserUpdate,
        });

        const response = await Container.get(AuthService).updateAvatar({ userId, url });

        expect(mockUserUpdate).toHaveBeenCalled();
        expect(mockUserUpdate.mock.calls[0][1]).toEqual(userId);
        expect(mockUserUpdate.mock.calls[0][2]).toEqual({ avatar: url });
        expect(response.data).toMatchObject(existingUser);
      });
    });

    describe('error', () => {
      it('should catch errors while updating the user avatar', async () => {
        const userId = '123456';
        const url = 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1';

        Container.set(UserRepository, {
          update: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_ERROR')),
        });

        await expect(Container.get(AuthService).updateAvatar({ userId, url })).rejects.toHaveProperty('message', 'SAMPLE_USER_ERROR');
      });
    });
  });

  describe('updatePassword()', () => {
    describe('success', () => {
      it('should update the user password with the provided id', async () => {
        const userId = '123456';
        const password = 'new-password';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          createdAt: new Date().toISOString(),
          isActivated: true,
        };
        const mockUserUpdate = jest.fn().mockResolvedValueOnce(existingUser);
        const mockBcryptHash = jest.fn().mockResolvedValueOnce('SAMPLE_NEW_HASH');

        bcrypt.hash = mockBcryptHash;
        Container.set(UserRepository, {
          update: mockUserUpdate,
        });

        const response = await Container.get(AuthService).updatePassword({ userId, password });

        expect(mockUserUpdate).toHaveBeenCalled();
        expect(mockUserUpdate.mock.calls[0][1]).toEqual(userId);
        expect(mockUserUpdate.mock.calls[0][2]).toEqual({ password: 'SAMPLE_NEW_HASH' });
        expect(mockBcryptHash).toHaveBeenCalledWith(password, 12);
        expect(response).toHaveProperty('message', 'Successfully updated password.');
      });
    });

    describe('error', () => {
      it('should catch errors while updating the user password', async () => {
        const userId = '123456';
        const password = 'new-password';

        Container.set(UserRepository, {
          update: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_ERROR')),
        });

        await expect(Container.get(AuthService).updatePassword({ userId, password })).rejects.toHaveProperty('message', 'SAMPLE_USER_ERROR');
      });
    });
  });

  describe('logoutUser()', () => {
    describe('success', () => {
      it('should decode the provided JWT token', async () => {
        const salt = '123456';
        const token = '678910';
        const mockJwtDecode = jest.spyOn(jwt, 'decode').mockImplementationOnce(() => ({ token }));

        Container.set(SaltRepository, {
          delete: jest.fn().mockResolvedValueOnce(true),
        });
        Container.set(RefreshTokenRepository, {
          findByIdAndDelete: jest.fn().mockResolvedValueOnce({ _id: '123456' }),
        });

        const response = await Container.get(AuthService).logoutUser({ salt, token });

        expect(mockJwtDecode).toHaveBeenCalled();
        expect(response).toHaveProperty('message', 'Successfully logged out.');
      });

      it('should delete the salt & related refresh token', async () => {
        const salt = '123456';
        const token = '678910';
        const mockSaltDelete = jest.fn().mockResolvedValueOnce(true);
        const mockRefreshTokenFind = jest.fn().mockResolvedValueOnce({ _id: '123456' });

        jest.spyOn(jwt, 'decode').mockImplementationOnce(() => ({ token }));
        Container.set(SaltRepository, {
          delete: mockSaltDelete,
        });
        Container.set(RefreshTokenRepository, {
          findByIdAndDelete: mockRefreshTokenFind,
        });

        const response = await Container.get(AuthService).logoutUser({ salt, token });

        expect(mockSaltDelete).toHaveBeenCalledWith('salt', salt);
        expect(mockRefreshTokenFind).toHaveBeenCalledWith(token);
        expect(response).toHaveProperty('message', 'Successfully logged out.');
      });
    });

    describe('error', () => {
      it('should catch errors when decoding the JWT token', async () => {
        const salt = '123456';
        const token = '678910';

        jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
          throw new Error('SAMPLE_JWT_ERROR');
        });

        await expect(Container.get(AuthService).logoutUser({ salt, token })).rejects.toHaveProperty('message', 'SAMPLE_JWT_ERROR');
      });
    });
  });
});
