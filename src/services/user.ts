import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import configs from '../configs';
import User from '../models/user';
import { UserModel } from '../common/interfaces/database';
import { AuthRequest } from '../common/interfaces/requests';
import { ResultResponse } from '../common/interfaces/responses';

export default class UserService {
  public constructor() {
    //
  }

  public async registerUser({ name, email, password }: AuthRequest): Promise<ResultResponse<UserModel>> {
    try {
      const buffer = crypto.randomBytes(64);
      const salt = buffer.toString('hex');
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({ name, email, password: hashedPassword, salt, is_activated: false });
      const result = await user.save();

      return { status: 'success', data: result };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }

  public async authenticateUser({ email, password }: AuthRequest): Promise<ResultResponse<string>> {
    try {
      const user = await User.findOne({ email });
      const isMatched = await bcrypt.compare(password, user!.password);

      if (isMatched) {
        const token = jwt.sign(
          {
            auth: user!._id.toString(),
            email,
            salt: user!.salt,
          },
          configs.app.auth.jwt.secret,
          { expiresIn: configs.app.auth.jwt.lifetime },
        );

        return { status: 'success', data: token };
      } else {
        return { status: 'error', message: 'Unauthorised. User password entered is incorrect.' };
      }
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
}
