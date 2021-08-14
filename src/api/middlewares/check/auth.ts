import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import configs from '../../../configs';
import Salt from '../../../models/salt';
import { HttpStatusCodes } from '../../../common/enums/http';
import UnauthorizedError from '../../../common/errors/unauthorized';

class AuthCheck {
  public constructor() {
    //
  }

  public async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasAuthHeader = req.get('Authorization');

      if (hasAuthHeader) {
        const authHeader = hasAuthHeader;
        const token = authHeader.split(' ')[1];

        const isDecodedToken = jwt.verify(token, configs.app.auth.jwt.secret);

        if (isDecodedToken) {
          const decodedToken = <{ auth: string; salt: string }>isDecodedToken;
          const isValidToken = await Salt.exists({ salt: decodedToken.salt });

          if (isValidToken) {
            req.auth = decodedToken.auth;

            next();
          } else {
            throw new UnauthorizedError(`Authentication failed. Please login.`);
          }
        } else {
          throw new UnauthorizedError(`Authentication failed. Please login.`);
        }
      } else {
        throw new UnauthorizedError('Unauthorized. Bearer token is required for authentication.');
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        next(new UnauthorizedError('Unauthorized. Bearer token is expired.'));
      } else {
        if (!err.statusCode) {
          err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
        }

        next(err);
      }
    }
  }
}

export default new AuthCheck();
