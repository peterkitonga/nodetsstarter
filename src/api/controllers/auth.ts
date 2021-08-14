import { Request, Response, NextFunction } from 'express';

import AuthService from '../../services/auth';
import MailerService from '../../services/mailer';
import Autobind from '../../common/decorators/autobind';
import { HttpStatusCodes } from '../../common/enums/http';
import { ResultResponse, TokenResponse } from '../../common/interfaces/responses';
import { AuthRequest, ActivationRequest, ResetPasswordRequest } from '../../common/interfaces/requests';

import ForbiddenError from '../../common/errors/forbidden';
import UnauthorizedError from '../../common/errors/unauthorized';

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
    res: Response<ResultResponse<Partial<TokenResponse>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const authentication = await this.authService.authenticateUser(request);
      const { token, refresh_token, lifetime, auth } = authentication.data!;

      res.cookie('refresh_token', refresh_token, {
        maxAge: Number(lifetime) * 2 * 1000,
        httpOnly: true,
      });
      res.status(HttpStatusCodes.OK).json({ status: 'success', data: { token, lifetime, auth } });
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

  @Autobind
  public async resetPassword(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response<ResultResponse<null>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      const resetPassword = await this.authService.resetPassword({ token, password });

      res.status(HttpStatusCodes.OK).json({
        status: 'status',
        message: `Password for '${resetPassword!.data!.email}' has been reset successfully.`,
      });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }

  @Autobind
  public async refreshToken(
    req: Request,
    res: Response<ResultResponse<Partial<TokenResponse>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (req.cookies && req.cookies.refresh_token) {
        const refreshToken = await this.authService.refreshToken(req.cookies.refresh_token);
        const { token, refresh_token, lifetime } = refreshToken.data!;

        res.cookie('refresh_token', refresh_token, {
          maxAge: Number(lifetime) * 2 * 1000,
          httpOnly: true,
        });
        res.status(HttpStatusCodes.CREATED).json({ status: 'success', data: { token, lifetime } });
      } else {
        throw new UnauthorizedError(`Authentication failed. Please login.`);
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }

  @Autobind
  public async logoutUser(req: Request, res: Response<ResultResponse<null>>, next: NextFunction): Promise<void> {
    try {
      if (req.cookies && req.cookies.refresh_token) {
        const logoutUser = await this.authService.logoutUser({ salt: req.salt!, token: req.cookies.refresh_token });

        res.clearCookie('refresh_token', { httpOnly: true });
        res.status(HttpStatusCodes.OK).json(logoutUser);
      } else {
        throw new ForbiddenError(`Logout failed. Refresh token missing.`);
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = HttpStatusCodes.INTERNAL_SERVER;
      }

      next(err);
    }
  }
}

export default new AuthController();
