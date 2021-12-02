import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import configs from '../configs';
import User from '../models/user';
import Salt from '../models/salt';
import RefreshToken from '../models/refresh-token';
import PasswordReset from '../models/password-reset';
import { ResultResponse, TokenResponse } from '../common/interfaces/responses';
import { AuthRequest, ResetPasswordRequest } from '../common/interfaces/requests';
import { UserModel, PasswordResetModel, RefreshTokenModel, SaltModel } from '../common/interfaces/database';

import NotFoundError from '../common/errors/not-found';
import ForbiddenError from '../common/errors/forbidden';
import UnauthorizedError from '../common/errors/unauthorized';

export default class AuthService {
  public constructor() {
    //
  }

  public async registerUser({ name, email, password }: AuthRequest): Promise<ResultResponse<SaltModel>> {
    try {
      const isRegistered = await User.exists({ email });

      if (isRegistered) {
        throw new ForbiddenError(`User with email '${email}' already exists.`);
      } else {
        const buffer = crypto.randomBytes(64);
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({ name, email, password: hashedPassword, is_activated: false });
        await newUser.save();

        const newSalt = new Salt({ salt: buffer.toString('hex'), user: newUser._id });
        const storedSalt = await newSalt.save();

        return { status: 'success', data: storedSalt };
      }
    } catch (err) {
      throw err;
    }
  }

  public async authenticateUser({ email, password, remember_me }: AuthRequest): Promise<ResultResponse<TokenResponse>> {
    try {
      const user = await User.findOne({ email });

      if (user) {
        if (user.is_activated) {
          const isMatched = await bcrypt.compare(password, user.password);

          if (isMatched) {
            const { name, avatar, is_activated, created_at } = user;
            let generatedTokens: ResultResponse<Partial<TokenResponse>>;

            if (remember_me) {
              generatedTokens = await this.generateTokens({ user_id: user!._id.toString(), duration: 720 });
            } else {
              generatedTokens = await this.generateTokens({ user_id: user!._id.toString(), duration: 24 });
            }

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
      const isValidCode = await Salt.findOne({ salt: code });

      if (isValidCode) {
        const currentSalt = isValidCode;
        const user = await User.findById(currentSalt.user);

        if (user!.is_activated) {
          throw new ForbiddenError(`User account with activation code '${code}' is already activated.`);
        } else {
          user!.is_activated = true;
          const { name, email, is_activated } = await user!.save();

          await Salt.deleteOne({ salt: currentSalt.salt });

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
        const hashedPassword = await bcrypt.hash(password!, 12);

        const currentUser = await User.findOne({ email });
        currentUser!.password = hashedPassword;
        await currentUser!.save();

        await PasswordReset.deleteOne({ email });
        await Salt.deleteMany({ user: currentUser! });
        await RefreshToken.deleteMany({ user: currentUser! });

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
        const decodedToken = <{ token: string; duration: number; salt: string }>isDecodedToken;
        const isValidToken = await Salt.exists({ salt: decodedToken.salt });

        if (isValidToken) {
          const existingToken = await RefreshToken.findByIdAndDelete(decodedToken.token);
          const authUser = await User.findById(existingToken!.user);
          await Salt.deleteOne({ salt: decodedToken.salt });

          const generatedTokens = await this.generateTokens({
            user_id: authUser!._id.toString(),
            duration: decodedToken.duration,
          });

          return {
            status: 'success',
            data: {
              token: generatedTokens.data!.token,
              refresh_token: generatedTokens.data!.refresh_token,
              lifetime: decodedToken.duration.toString(),
            },
          };
        } else {
          throw new UnauthorizedError(`Authentication failed. Please login.`);
        }
      } else {
        throw new UnauthorizedError(`Authentication failed. Please login.`);
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedError('Unauthorized. Refresh token is expired.');
      } else {
        throw err;
      }
    }
  }

  public async getUser(userId: string): Promise<ResultResponse<Partial<UserModel>>> {
    try {
      const user = await User.findById(userId);
      const { name, email, avatar, is_activated, created_at } = user!;

      return {
        status: 'success',
        data: { name, email, avatar, is_activated, created_at },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updateUser(userId: string, { name, email }: AuthRequest): Promise<ResultResponse<Partial<UserModel>>> {
    try {
      const user = await User.findById(userId);
      user!.name = name!;
      user!.email = email;
      const result = await user!.save();

      return {
        status: 'success',
        data: {
          name: result.name,
          email: result.email,
          avatar: result.avatar,
          is_activated: result.is_activated,
          created_at: result.created_at,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updateAvatar({
    user_id,
    url,
  }: Record<'user_id' | 'url', string>): Promise<ResultResponse<Partial<UserModel>>> {
    try {
      const user = await User.findById(user_id);
      user!.avatar = url;
      const result = await user!.save();
      const { name, email, avatar, is_activated, created_at } = result;

      return {
        status: 'success',
        data: { name, email, avatar, is_activated, created_at },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updatePassword({
    user_id,
    password,
  }: Record<'user_id' | 'password', string>): Promise<ResultResponse<null>> {
    try {
      const hashedPassword = await bcrypt.hash(password!, 12);

      const user = await User.findById(user_id);
      user!.password = hashedPassword;
      await user!.save();

      return {
        status: 'success',
        message: 'Successfully updated password.',
      };
    } catch (err) {
      throw err;
    }
  }

  public async logoutUser({ salt, token }: Record<'salt' | 'token', string>): Promise<ResultResponse<null>> {
    try {
      const decode = jwt.decode(token);
      const decodedToken = <{ token: string }>decode;

      await Salt.deleteOne({ salt });
      await RefreshToken.deleteOne({ _id: decodedToken.token });

      return { status: 'success', message: 'Successfully logged out.' };
    } catch (err) {
      throw err;
    }
  }

  private async createRefreshToken({
    user_id,
    duration,
  }: {
    user_id: string;
    duration: number;
  }): Promise<ResultResponse<RefreshTokenModel>> {
    try {
      const additionalTime = 3600 * duration * 1000;

      const refreshToken = new RefreshToken({
        user: user_id,
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
    duration,
  }: {
    user_id: string;
    duration: number;
  }): Promise<ResultResponse<Partial<TokenResponse>>> {
    try {
      const buffer = crypto.randomBytes(64);
      const salt = buffer.toString('hex');

      const newSalt = new Salt({ salt, user: user_id });
      await newSalt.save();

      const newToken = await this.createRefreshToken({ user_id, duration });
      const refreshToken = jwt.sign(
        {
          token: newToken.data!._id.toString(),
          duration,
          salt,
        },
        configs.app.auth.jwt.secret,
        { expiresIn: 3600 * duration },
      );

      const token = jwt.sign(
        {
          auth: user_id,
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
