import { Request, Response, NextFunction } from 'express';

import configs from '../../configs';
import AuthService from '../../services/auth';
import MailerService from '../../services/mailer';
import FileStorageService from '../../services/file';
import Autobind from '../../common/decorators/autobind';
import { HttpStatusCodes } from '../../common/enums/http';
import { UserModel } from '../../common/interfaces/database';
import { ResultResponse, TokenResponse } from '../../common/interfaces/responses';
import { AuthRequest, ActivationRequest, ResetPasswordRequest, FileRequest } from '../../common/interfaces/requests';

import ForbiddenError from '../../common/errors/forbidden';
import UnauthorizedError from '../../common/errors/unauthorized';

class AuthController {
  private authService: AuthService;
  private fileStorageService: FileStorageService;

  public constructor() {
    this.authService = new AuthService();
    this.fileStorageService = new FileStorageService();
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
      let maxAge: number;
      const request = req.body;
      const authentication = await this.authService.authenticateUser(request);
      const { token, refresh_token, lifetime, auth } = authentication.data!;

      if (request.remember_me) {
        maxAge = 3600 * 720 * 1000; // 30 days
      } else {
        maxAge = 3600 * 24 * 1000; // 24 hours
      }

      res.cookie('refresh_token', refresh_token, {
        maxAge,
        httpOnly: true,
      });
      res.status(HttpStatusCodes.OK).json({ status: 'success', data: { token, lifetime, auth } });
    } catch (err) {
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
          maxAge: 3600 * Number(lifetime) * 1000,
          httpOnly: true,
        });
        res
          .status(HttpStatusCodes.CREATED)
          .json({ status: 'success', data: { token, lifetime: configs.app.auth.jwt.lifetime } });
      } else {
        throw new UnauthorizedError(`Authentication failed. Please login.`);
      }
    } catch (err) {
      next(err);
    }
  }

  @Autobind
  public async getUser(
    req: Request,
    res: Response<ResultResponse<Partial<UserModel>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const getUser = await this.authService.getUser(req.auth!);

      res.status(HttpStatusCodes.OK).json(getUser);
    } catch (err) {
      next(err);
    }
  }

  @Autobind
  public async updateUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response<ResultResponse<Partial<UserModel>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const updateUser = await this.authService.updateUser(req.auth!, request);

      res.status(HttpStatusCodes.OK).json(updateUser);
    } catch (err) {
      next(err);
    }
  }

  @Autobind
  public async updateAvatar(
    req: Request<unknown, unknown, FileRequest>,
    res: Response<ResultResponse<Partial<UserModel>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const { data } = await this.authService.getUser(req.auth!);

      if (data!.avatar) {
        await this.fileStorageService.deleteFile(data!.avatar);
      }

      const storeFile = await this.fileStorageService.storeFile(request.file);
      const updateAvatar = await this.authService.updateAvatar({ user_id: req.auth!, url: storeFile.data! });

      res.status(HttpStatusCodes.OK).json(updateAvatar);
    } catch (err) {
      next(err);
    }
  }

  @Autobind
  public async updatePassword(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response<ResultResponse<null>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const request = req.body;
      const updatePassword = await this.authService.updatePassword({ user_id: req.auth!, password: request.password });

      res.status(HttpStatusCodes.OK).json(updatePassword);
    } catch (err) {
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
      next(err);
    }
  }
}

export default new AuthController();
