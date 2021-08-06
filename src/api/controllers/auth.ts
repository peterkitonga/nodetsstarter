import { Request, Response, NextFunction } from 'express';

import AuthService from '../../services/auth';
import MailerService from '../../services/mailer';
import Autobind from '../../common/decorators/autobind';
import { HttpStatusCodes } from '../../common/enums/http';
import { AuthRequest, ActivationRequest, ResetPasswordRequest } from '../../common/interfaces/requests';
import { ResultResponse, TokenResponse } from '../../common/interfaces/responses';

class AuthController {
  private authService: AuthService;

  public constructor() {
    this.authService = new AuthService();
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
      const registration = await this.authService.registerUser(request);
      await mailerService.sendWelcomeEmail(registration.data!.salt);

      res.status(HttpStatusCodes.CREATED).json({
        status: 'success',
        message: `Successfully registered. Please check your email '${request.email}' for the activation link.`,
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
      const authentication = await this.authService.authenticateUser(request);

      res.status(HttpStatusCodes.OK).json(authentication);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }

  @Autobind
  public async activateUser(
    req: Request<ActivationRequest>,
    res: Response<ResultResponse<null>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.params;
      const activation = await this.authService.activateUser(request.code);

      res
        .status(HttpStatusCodes.OK)
        .json({ status: 'status', message: `User with email '${activation.data!.email}' successfully activated.` });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }

  @Autobind
  public async sendResetLink(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response<ResultResponse<null>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const mailerService = new MailerService(request.email!);
      const reset = await this.authService.createResetToken(request.email!);
      await mailerService.sendResetPasswordEmail(reset.data!.token!);

      res
        .status(HttpStatusCodes.CREATED)
        .json({ status: 'status', message: `A password reset link has been sent to '${request.email}'.` });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }
}

export default new AuthController();
