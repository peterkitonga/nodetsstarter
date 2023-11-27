import { Service } from 'typedi';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import configs from '@src/configs';
import SaltRepository from '@src/repositories/salt';
import Autobind from '@src/shared/decorators/autobind';
import UnauthorizedError from '@src/shared/errors/unauthorized';

@Service()
export default class AuthCheck {
  public constructor(private saltRepository: SaltRepository) {
    //
  }

  @Autobind
  public async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.get('Authorization');

      if (authHeader) {
        const token = authHeader.split(' ')[1];

        const isDecodedToken = jwt.verify(token, configs.app.auth.jwt.secret);

        if (isDecodedToken) {
          const decodedToken = <{ auth: string; salt: string }>isDecodedToken;
          const isValidToken = await this.saltRepository.isValid(decodedToken.salt);

          if (isValidToken) {
            req.auth = decodedToken.auth;
            req.salt = decodedToken.salt;

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
        next(err);
      }
    }
  }
}
