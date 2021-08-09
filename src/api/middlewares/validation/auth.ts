import joi from 'joi';
import { Request, Response, NextFunction } from 'express';

import ValidationError from '../../../common/errors/validation';
import { AuthRequest, ResetPasswordRequest } from '../../../common/interfaces/requests';

class AuthValidator {
  public constructor() {
    //
  }

  public async registerUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const registrationSchema = joi.object().keys({
        name: joi.string().min(3).max(255).trim(true).required().label('name').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
          'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
          'any.required': `The {#label} field is required`,
        }),
        email: joi.string().email().trim(true).required().label('email').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.email': `The {#label} field should be a valid email`,
          'any.required': `The {#label} field is required`,
        }),
        password: joi.string().min(6).trim(true).required().label('password').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
          'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
          'any.required': `The {#label} field is required`,
        }),
        password_confirmation: joi
          .any()
          .equal(joi.ref('password'))
          .required()
          .label('password_confirmation')
          .options({ messages: { 'any.only': `The {#label} field should match the password` } }),
      });

      await registrationSchema.validateAsync(request);

      next();
    } catch (err) {
      const { message } = err.details[0];

      next(new ValidationError(message, request));
    }
  }

  public async authenticateUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const authenticationSchema = joi.object({
        email: joi.string().email().trim(true).required().label('email').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.email': `The {#label} field should be a valid email`,
          'any.required': `The {#label} field is required`,
        }),
        password: joi.string().min(6).trim(true).required().label('password').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
          'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
          'any.required': `The {#label} field is required`,
        }),
      });

      await authenticationSchema.validateAsync(request);

      next();
    } catch (err) {
      const { message } = err.details[0];

      next(new ValidationError(message, request));
    }
  }

  public async sendResetLink(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const resetSchema = joi.object({
        email: joi.string().email().trim(true).required().label('email').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.email': `The {#label} field should be a valid email`,
          'any.required': `The {#label} field is required`,
        }),
      });

      await resetSchema.validateAsync(request);

      next();
    } catch (err) {
      const { message } = err.details[0];

      next(new ValidationError(message, request));
    }
  }

  public async resetPassword(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const resetPasswordSchema = joi.object({
        token: joi.string().trim(true).required().label('token').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'any.required': `The {#label} field is required`,
        }),
        password: joi.string().min(6).trim(true).required().label('password').messages({
          'string.base': `The {#label} field should be text`,
          'string.empty': `The {#label} field cannot be empty`,
          'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
          'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
          'any.required': `The {#label} field is required`,
        }),
        password_confirmation: joi
          .any()
          .equal(joi.ref('password'))
          .required()
          .label('password_confirmation')
          .options({ messages: { 'any.only': `The {#label} field should match the password` } }),
      });

      await resetPasswordSchema.validateAsync(request);

      next();
    } catch (err) {
      const { message } = err.details[0];

      next(new ValidationError(message, request));
    }
  }
}

export default new AuthValidator();
