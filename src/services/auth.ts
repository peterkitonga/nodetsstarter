import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import configs from '../configs';
import User from '../models/user';
import RefreshToken from '../models/refresh-token';
import PasswordReset from '../models/password-reset';
import { AuthRequest, ResetPasswordRequest } from '../common/interfaces/requests';
import { UserModel, PasswordResetModel, RefreshTokenModel } from '../common/interfaces/database';
import { ResultResponse, TokenResponse } from '../common/interfaces/responses';

import NotFoundError from '../common/errors/not-found';
import ForbiddenError from '../common/errors/forbidden';
import UnauthorizedError from '../common/errors/unauthorized';

export default class AuthService {
  public constructor() {
    //
  }

  public async registerUser({ name, email, password }: AuthRequest): Promise<ResultResponse<UserModel>> {
    try {
      const isRegistered = await User.exists({ email });

      if (isRegistered) {
        throw new ForbiddenError(`User with email '${email}' already exists.`);
      } else {
        const buffer = crypto.randomBytes(64);
        const salt = buffer.toString('hex');
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({ name, email, password: hashedPassword, salt, is_activated: false });
        const result = await user.save();

        return { status: 'success', data: result };
      }
    } catch (err) {
      throw err;
    }
  }

  public async authenticateUser({ email, password }: AuthRequest): Promise<ResultResponse<TokenResponse>> {
    try {
      const user = await User.findOne({ email });

      if (user) {
        if (user.is_activated) {
          const isMatched = await bcrypt.compare(password, user.password);

          if (isMatched) {
            const { name, avatar, is_activated, created_at } = user;
            const generatedTokens = await this.generateTokens({
              user_id: user!._id.toString(),
              email: user!.email,
              salt: user!.salt,
            });

            return {
              status: 'success',
              data: {
                token: generatedTokens.data!.token!,
                refresh_token: generatedTokens.data!.refresh_token!,
                lifetime: configs.app.auth.jwt.lifetime,
                auth: {
                  name,
                  email,
                  avatar: avatar || '',
                  is_activated,
                  created_at,
                },
              },
            };
          } else {
            throw new UnauthorizedError('Unauthorised. User password entered is incorrect.');
          }
        } else {
          throw new ForbiddenError(`User with email '${email}' is not activated yet.`);
        }
      } else {
        throw new NotFoundError(`User with email '${email}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async activateUser(code: string): Promise<ResultResponse<Partial<UserModel>>> {
    try {
      const isValidCode = await User.exists({ salt: code });

      if (isValidCode) {
        const user = await User.findOne({ salt: code });

        if (user!.is_activated) {
          throw new ForbiddenError(`User account with activation code '${code}' is already activated.`);
        } else {
          const buffer = crypto.randomBytes(64);
          const newSalt = buffer.toString('hex');

          user!.is_activated = true;
          user!.salt = newSalt;

          const { name, email, is_activated } = await user!.save();

          return {
            status: 'success',
            data: {
              name,
              email,
              is_activated,
            },
          };
        }
      } else {
        throw new NotFoundError(`User with activation code '${code}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async createResetToken(email: string): Promise<ResultResponse<Partial<PasswordResetModel>>> {
    try {
      const isRegistered = await User.exists({ email });

      if (isRegistered) {
        const buffer = crypto.randomBytes(64);
        const passwordReset = new PasswordReset({ email, token: buffer.toString('hex') });
        const { token } = await passwordReset.save();

        return { status: 'success', data: { email, token } };
      } else {
        throw new NotFoundError(`User with email '${email}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async resetPassword({
    token,
    password,
  }: ResetPasswordRequest): Promise<ResultResponse<Partial<PasswordResetModel>>> {
    try {
      const isValidToken = await PasswordReset.findOne({ token });

      if (isValidToken) {
        const { email } = isValidToken;
        const buffer = crypto.randomBytes(64);
        const salt = buffer.toString('hex');
        const hashedPassword = await bcrypt.hash(password!, 12);

        const user = await User.findOne({ email });
        user!.salt = salt;
        user!.password = hashedPassword;
        await user!.save();

        await PasswordReset.deleteOne({ email });

        return { status: 'success', data: { email } };
      } else {
        throw new NotFoundError(`Password reset token '${token}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async refreshToken(encryptedToken: string): Promise<ResultResponse<Partial<TokenResponse>>> {
    try {
      const isDecodedToken = jwt.verify(encryptedToken, configs.app.auth.jwt.secret);

      if (isDecodedToken) {
        const decodedToken = <{ token: string }>isDecodedToken;

        const existingToken = await RefreshToken.findByIdAndDelete(decodedToken.token);
        const authUser = await User.findById(existingToken!.user);

        const generatedTokens = await this.generateTokens({
          user_id: authUser!._id.toString(),
          email: authUser!.email,
          salt: authUser!.salt,
        });

        return {
          status: 'success',
          data: {
            token: generatedTokens.data!.token,
            refresh_token: generatedTokens.data!.refresh_token,
            lifetime: configs.app.auth.jwt.lifetime,
          },
        };
      } else {
        throw new UnauthorizedError(`Authentication failed. Please login.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async logoutUser(userId: string): Promise<ResultResponse<null>> {
    try {
      const authUser = await User.findById(userId);
      await RefreshToken.deleteMany({ user: authUser! });

      return { status: 'success', message: 'Successfully logged out.' };
    } catch (err) {
      throw err;
    }
  }

  private async createRefreshToken(userId: string): Promise<ResultResponse<RefreshTokenModel>> {
    try {
      const additionalTime = Number(configs.app.auth.jwt.lifetime) * 2 * 1000;

      const refreshToken = new RefreshToken({
        user: userId,
        expires_at: Date.now() + additionalTime,
      });
      const result = await refreshToken.save();

      return { status: 'success', data: result };
    } catch (err) {
      throw err;
    }
  }

  private async generateTokens({
    user_id,
    email,
    salt,
  }: Record<'user_id' | 'email' | 'salt', string>): Promise<ResultResponse<Partial<TokenResponse>>> {
    try {
      const newToken = await this.createRefreshToken(user_id);
      const refreshToken = jwt.sign(
        {
          token: newToken.data!._id.toString(),
        },
        configs.app.auth.jwt.secret,
        { expiresIn: Number(configs.app.auth.jwt.lifetime) * 2 },
      );

      const token = jwt.sign(
        {
          auth: user_id,
          email,
          salt,
        },
        configs.app.auth.jwt.secret,
        { expiresIn: Number(configs.app.auth.jwt.lifetime) },
      );

      return { status: 'success', data: { token, refresh_token: refreshToken } };
    } catch (err) {
      throw err;
    }
  }
}
