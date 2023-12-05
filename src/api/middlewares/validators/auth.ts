import joi from 'joi';
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';

import Autobind from '@src/shared/decorators/autobind';
import BaseValidator from '@src/api/middlewares/validators/base';
import { AuthRequest, FileRequest, ResetPasswordRequest } from '@src/shared/interfaces/requests';

@Service()
export default class AuthValidator extends BaseValidator {
  @Autobind
  public async registerUser(req: Request<unknown, unknown, AuthRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const registrationSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          name: this.stringValidationSchema('name').required(),
          email: this.emailValidationSchema('email').required(),
          password: this.stringValidationSchema('password', 6).required(),
          passwordConfirmation: this.confirmValidationSchema('passwordConfirmation', 'password').required(),
        });

      await registrationSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async authenticateUser(req: Request<unknown, unknown, AuthRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const authenticationSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          email: this.emailValidationSchema('email').required(),
          password: this.stringValidationSchema('password', 6).required(),
          rememberMe: this.booleanValidationSchema('rememberMe').required(),
        });

      await authenticationSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async sendResetLink(req: Request<unknown, unknown, ResetPasswordRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const resetSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          email: this.emailValidationSchema('email').required(),
        });

      await resetSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async resetPassword(req: Request<unknown, unknown, ResetPasswordRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const resetPasswordSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          token: this.stringValidationSchema('token').required(),
          password: this.stringValidationSchema('password', 6),
          passwordConfirmation: this.confirmValidationSchema('passwordConfirmation', 'password').required(),
        });

      await resetPasswordSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updateUser(req: Request<unknown, unknown, AuthRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const updateUserSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          name: this.stringValidationSchema('name').required(),
          email: this.emailValidationSchema('email').required(),
        });

      await updateUserSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updateAvatar(req: Request<unknown, unknown, FileRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const updateAvatarSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          file: this.imageValidationSchema('file').required(),
        });

      await updateAvatarSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updatePassword(req: Request<unknown, unknown, AuthRequest>, res: Response, next: NextFunction): Promise<void> {
    const request = req.body;

    try {
      const updatePasswordSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          password: this.stringValidationSchema('password', 6).required(),
          passwordConfirmation: this.confirmValidationSchema('passwordConfirmation', 'password').required(),
        });

      await updatePasswordSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }
}
