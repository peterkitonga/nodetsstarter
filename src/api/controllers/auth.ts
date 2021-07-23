import { Request, Response, NextFunction } from 'express';

import UserService from '../../services/user';
import MailerService from '../../services/mailer';
import Autobind from '../../common/decorators/autobind';
import { HttpStatusCodes } from '../../common/enums/http';
import { AuthRequest } from '../../common/interfaces/requests';
import { ResultResponse, TokenResponse } from '../../common/interfaces/responses';

export default class AuthController {
  private userService: UserService;

  public constructor() {
    this.userService = new UserService();
  }

  @Autobind
  public async registerUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response<ResultResponse<null>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const mailerService = new MailerService(request.email);
      const registration = await this.userService.registerUser(request);
      await mailerService.sendWelcomeEmail(registration.data!.salt);

      res.status(HttpStatusCodes.CREATED).json({
        status: 'success',
        message: `Successfully registered. Please check your email '${request.email}' for the verification link`,
      });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }

  @Autobind
  public async authenticateUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response<ResultResponse<TokenResponse>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const authentication = await this.userService.authenticateUser(request);

      res.status(HttpStatusCodes.OK).json(authentication);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }
}
