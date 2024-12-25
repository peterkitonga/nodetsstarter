import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Service } from 'typedi';
import { HydratedDocument } from 'mongoose';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import configs from '@src/configs';
import UserRepository from '@src/repositories/user';
import SaltRepository from '@src/repositories/salt';
import RefreshTokenRepository from '@src/repositories/refresh-token';
import PasswordResetRepository from '@src/repositories/password-reset';
import { AppResponse, TokenResponse } from '@src/shared/interfaces/responses';
import { AuthRequest, ResetPasswordRequest } from '@src/shared/interfaces/requests';
import { UserModel, PasswordResetModel, RefreshTokenModel, SaltModel } from '@src/shared/interfaces/database';

import NotFoundError from '@src/shared/errors/not-found';
import ForbiddenError from '@src/shared/errors/forbidden';
import UnauthorizedError from '@src/shared/errors/unauthorized';

@Service()
export default class AuthService {
  constructor(
    private userRepository: UserRepository,
    private passwordResetRepository: PasswordResetRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private saltRepository: SaltRepository,
  ) {
    //
  }

  public async registerUser({ name, email, password }: AuthRequest): Promise<AppResponse<Partial<SaltModel>>> {
    try {
      const isRegistered = await this.userRepository.isRegistered(email);

      if (isRegistered) {
        throw new ForbiddenError(`User with email '${email}' already exists.`);
      } else {
        const buffer = crypto.randomBytes(64);
        const hashedPassword = await bcrypt.hash(password, 12);
        const salt = buffer.toString('hex');

        const newUser = await this.userRepository.create({ name, email, password: hashedPassword, isActivated: false });

        await this.saltRepository.create({ salt, user: newUser._id });

        return {
          data: {
            salt,
          },
        };
      }
    } catch (err) {
      throw err;
    }
  }

  public async authenticateUser({ email, password, rememberMe }: AuthRequest): Promise<AppResponse<TokenResponse>> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (user) {
        if (user.isActivated) {
          const isMatched = await bcrypt.compare(password, user.password);

          if (isMatched) {
            const { name, avatar, isActivated, createdAt } = user;
            let generatedTokens: AppResponse<Partial<TokenResponse>>;

            if (rememberMe) {
              generatedTokens = await this.generateTokens({ userId: user!._id.toString(), duration: 720 });
            } else {
              generatedTokens = await this.generateTokens({ userId: user!._id.toString(), duration: 24 });
            }

            return {
              data: {
                token: generatedTokens.data!.token!,
                refreshToken: generatedTokens.data!.refreshToken!,
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
      const currentSalt = await this.saltRepository.findBySalt(code);

      if (currentSalt) {
        const user = currentSalt.user as HydratedDocument<UserModel>;

        if (user!.isActivated) {
          throw new ForbiddenError(`User account with activation code '${code}' is already activated.`);
        } else {
          user!.isActivated = true;
          const { name, email, isActivated } = await user!.save();

          await this.saltRepository.delete('salt', currentSalt.salt);

          return {
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

        return { data: { email, token } };
      } else {
        throw new NotFoundError(`User with email '${email}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async resetPassword({ token, password }: ResetPasswordRequest): Promise<AppResponse<Partial<PasswordResetModel>>> {
    try {
      const validToken = await this.passwordResetRepository.findByToken(token!);

      if (validToken) {
        const { email } = validToken;
        const hashedPassword = await bcrypt.hash(password!, 12);
        const updatedUser = await this.userRepository.update('email', email, { password: hashedPassword });

        await this.passwordResetRepository.delete('email', email);
        await this.saltRepository.delete('user', updatedUser!._id, 'many');
        await this.refreshTokenRepository.delete('user', updatedUser!._id, 'many');

        return { data: { email } };
      } else {
        throw new NotFoundError(`Password reset token '${token}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }

  public async refreshToken(encryptedToken: string): Promise<AppResponse<Partial<TokenResponse>>> {
    try {
      const verifiedDecodedToken = jwt.verify(encryptedToken, configs.app.auth.jwt.secret);

      if (verifiedDecodedToken) {
        const decodedToken = <{ token: string; duration: number; salt: string }>verifiedDecodedToken;
        const isValidToken = await this.saltRepository.isValid(decodedToken.salt);

        if (isValidToken) {
          const existingToken = await this.refreshTokenRepository.findByIdAndDelete(decodedToken.token);
          const authUser = existingToken!.user as UserModel;

          await this.saltRepository.delete('salt', decodedToken.salt);

          const generatedTokens = await this.generateTokens({
            userId: authUser!._id.toString(),
            duration: decodedToken.duration,
          });

          return {
            data: {
              token: generatedTokens.data!.token,
              refreshToken: generatedTokens.data!.refreshToken,
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

  public async updateAvatar({ userId, url }: Record<'userId' | 'url', string>): Promise<AppResponse<Partial<UserModel>>> {
    try {
      const updatedUser = await this.userRepository.update('_id', userId, { avatar: url });
      const { name, email, avatar, isActivated, createdAt } = updatedUser;

      return {
        data: { name, email, avatar, isActivated, createdAt },
      };
    } catch (err) {
      throw err;
    }
  }

  public async updatePassword({ userId, password }: Record<'userId' | 'password', string>): Promise<AppResponse<null>> {
    try {
      const hashedPassword = await bcrypt.hash(password!, 12);

      await this.userRepository.update('_id', userId, { password: hashedPassword });

      return {
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

      await this.saltRepository.delete('salt', salt);
      await this.refreshTokenRepository.findByIdAndDelete(decodedToken.token);

      return { message: 'Successfully logged out.' };
    } catch (err) {
      throw err;
    }
  }

  private async createRefreshToken({ userId, duration }: { userId: string; duration: number }): Promise<AppResponse<RefreshTokenModel>> {
    try {
      const additionalTime = 3600 * duration * 1000;
      const newRefreshToken = await this.refreshTokenRepository.create({
        user: userId,
        expiresAt: new Date(Date.now() + additionalTime).toString(),
      });

      return { data: newRefreshToken };
    } catch (err) {
      throw err;
    }
  }

  private async generateTokens({ userId, duration }: { userId: string; duration: number }): Promise<AppResponse<Partial<TokenResponse>>> {
    try {
      const buffer = crypto.randomBytes(64);
      const salt = buffer.toString('hex');

      await this.saltRepository.create({ salt, user: userId });

      const newToken = await this.createRefreshToken({ userId, duration });
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
          auth: userId,
          salt,
        },
        configs.app.auth.jwt.secret,
        { expiresIn: Number(configs.app.auth.jwt.lifetime) },
      );

      return { data: { token, refreshToken } };
    } catch (err) {
      throw err;
    }
  }
}
