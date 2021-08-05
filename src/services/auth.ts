import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import configs from '../configs';
import User from '../models/user';
import { UserModel } from '../common/interfaces/database';
import { AuthRequest } from '../common/interfaces/requests';
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
        const isMatched = await bcrypt.compare(password, user.password);

        if (isMatched) {
          const token = jwt.sign(
            {
              auth: user._id.toString(),
              email,
              salt: user.salt,
            },
            configs.app.auth.jwt.secret,
            { expiresIn: configs.app.auth.jwt.lifetime },
          );

          const { name, avatar, is_activated, created_at } = user;

          const auth = {
            name,
            email,
            avatar: avatar ?? '',
            is_activated,
            created_at,
          };

          return { status: 'success', data: { token, lifetime: configs.app.auth.jwt.lifetime, auth } };
        } else {
          throw new UnauthorizedError('Unauthorised. User password entered is incorrect.');
        }
      } else {
        throw new NotFoundError(`Unauthorised. User with email '${email}' does not exist.`);
      }
    } catch (err) {
      throw err;
    }
  }
}
