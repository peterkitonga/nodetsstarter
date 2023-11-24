import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Service } from 'typedi';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import configs from '@src/configs';
import Salt from '@src/models/salt';
import RefreshToken from '@src/models/refresh-token';
import UserRepository from '@src/repositories/user';
import PasswordResetRepository from '@src/repositories/password-reset';
import { AppResponse, TokenResponse } from '@src/shared/interfaces/responses';
import { AuthRequest, ResetPasswordRequest } from '@src/shared/interfaces/requests';
import { UserModel, PasswordResetModel, RefreshTokenModel, SaltModel } from '@src/shared/interfaces/database';

import NotFoundError from '@src/shared/errors/not-found';
import ForbiddenError from '@src/shared/errors/forbidden';
import UnauthorizedError from '@src/shared/errors/unauthorized';

@Service()
export default class AuthService {
  constructor(private userRepository: UserRepository, private passwordResetRepository: PasswordResetRepository) {
    //
  }

  public async registerUser({ name, email, password }: AuthRequest): Promise<AppResponse<SaltModel>> {
    try {
      const isRegistered = await this.userRepository.isRegistered(email);

      if (isRegistered) {
        throw new ForbiddenError(`User with email '${email}' already exists.`);
      } else {
        const buffer = crypto.randomBytes(64);
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await this.userRepository.create({ name, email, password: hashedPassword, isActivated: false });

        const newSalt = new Salt({ salt: buffer.toString('hex'), user: newUser._id });
        const storedSalt = await newSalt.save();

        return { status: 'success', data: storedSalt };
      }
    } catch (err) {
      throw err;
    }
  }

  public async authenticateUser({ email, password, remember_me }: AuthRequest): Promise<AppResponse<TokenResponse>> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (user) {
        if (user.isActivated) {
          const isMatched = await bcrypt.compare(password, user.password);

          if (isMatched) {
            const { name, avatar, isActivated, createdAt } = user;
            let generatedTokens: AppResponse<Partial<TokenResponse>>;

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
                  isActivated: isActivated,
                  createdAt: createdAt,
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

  public async activateUser(code: string): Promise<AppResponse<Partial<UserModel>>> {
    try {
      const isValidCode = await Salt.findOne({ salt: code });

      if (isValidCode) {
        const currentSalt = isValidCode;
        const user = await this.userRepository.findById(currentSalt.user);

        if (user!.isActivated) {
          throw new ForbiddenError(`User account with activation code '${code}' is already activated.`);
        } else {
          user!.isActivated = true;
          const { name, email, isActivated } = await user!.save();

          await Salt.deleteOne({ salt: currentSalt.salt });

          return {
            status: 'success',
            data: {
              name,
              email,
              isActivated: isActivated,
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

  public async createResetToken(email: string): Promise<AppResponse<Partial<PasswordResetModel>>> {
    try {
      const isRegistered = await this.userRepository.isRegistered(email);

      if (isRegistered) {
        const buffer = crypto.randomBytes(64);
        const token = buffer.toString('hex');

        await this.passwordResetRepository.create({ email, token });

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
  }: ResetPasswordRequest): Promise<AppResponse<Partial<PasswordResetModel>>> {
    try {
      const validToken = await this.passwordResetRepository.findByToken(token!);

      if (validToken) {
        const { email } = validToken;
        const hashedPassword = await bcrypt.hash(password!, 12);
        const updatedUser = await this.userRepository.update('email', email, { password: hashedPassword });

        await this.passwordResetRepository.delete('email', email);
        await Salt.deleteMany({ user: updatedUser! });
        await RefreshToken.deleteMany({ user: updatedUser! });

        return { status: 'success', data: { email } };
      } else {
        throw new NotFoundError(`Password reset token '${token}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async refreshToken(encryptedToken: string): Promise<AppResponse<Partial<TokenResponse>>> {
    try {
      const isDecodedToken = jwt.verify(encryptedToken, configs.app.auth.jwt.secret);

      if (isDecodedToken) {
        const decodedToken = <{ token: string; duration: number; salt: string }>isDecodedToken;
        const isValidToken = await Salt.exists({ salt: decodedToken.salt });

        if (isValidToken) {
          const existingToken = await RefreshToken.findByIdAndDelete(decodedToken.token);
          const authUser = await this.userRepository.findById(existingToken!.user);

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

  public async getUser(userId: string): Promise<AppResponse<Partial<UserModel>>> {
    try {
      const user = await this.userRepository.findById(userId);
      const { name, email, avatar, isActivated, createdAt } = user!;

      return {
        status: 'success',
        data: { name, email, avatar, isActivated: isActivated, createdAt: createdAt },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updateUser(userId: string, { name, email }: AuthRequest): Promise<AppResponse<Partial<UserModel>>> {
    try {
      const updatedUser = await this.userRepository.update('_id', userId, { name, email });

      return {
        status: 'success',
        data: {
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          isActivated: updatedUser.isActivated,
          createdAt: updatedUser.createdAt,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updateAvatar({
    user_id,
    url,
  }: Record<'user_id' | 'url', string>): Promise<AppResponse<Partial<UserModel>>> {
    try {
      const updatedUser = await this.userRepository.update('_id', user_id, { avatar: url });
      const { name, email, avatar, isActivated, createdAt } = updatedUser;

      return {
        status: 'success',
        data: { name, email, avatar, isActivated, createdAt },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updatePassword({
    user_id,
    password,
  }: Record<'user_id' | 'password', string>): Promise<AppResponse<null>> {
    try {
      const hashedPassword = await bcrypt.hash(password!, 12);

      await this.userRepository.update('_id', user_id, { password: hashedPassword });

      return {
        status: 'success',
        message: 'Successfully updated password.',
      };
    } catch (err) {
      throw err;
    }
  }

  public async logoutUser({ salt, token }: Record<'salt' | 'token', string>): Promise<AppResponse<null>> {
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
  }): Promise<AppResponse<RefreshTokenModel>> {
    try {
      const additionalTime = 3600 * duration * 1000;

      const refreshToken = new RefreshToken({
        user: user_id,
        expiresAt: Date.now() + additionalTime,
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
  }): Promise<AppResponse<Partial<TokenResponse>>> {
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
