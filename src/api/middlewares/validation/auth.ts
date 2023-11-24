import { Service } from 'typedi';
import joi, { CustomHelpers } from 'joi';
import { Request, Response, NextFunction } from 'express';

import Autobind from '@src/shared/decorators/autobind';

import ValidationError from '@src/shared/errors/validation';
import { AuthRequest, FileRequest, ResetPasswordRequest } from '@src/shared/interfaces/requests';

@Service()
export default class AuthValidator {
  public constructor() {
    //
  }

  private handleValidationErrors(error: joi.ValidationError, next: NextFunction): void {
    const messages = error.details;
    const formattedMessages = [] as Record<string, string>[];

    for (const message of messages) {
      formattedMessages.push({
        field: message['context']!['label']!,
        message: message['message'],
      });
    }

    return next(new ValidationError('There are validation errors for your inputs', formattedMessages));
  }

  @Autobind
  public async registerUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const registrationSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async authenticateUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const authenticationSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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
          remember_me: joi.boolean().required().label('remember_me').messages({
            'boolean.base': `The {#label} field should be true/false`,
            'any.required': `The {#label} field is required`,
          }),
        });

      await authenticationSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async sendResetLink(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const resetSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async resetPassword(
    req: Request<unknown, unknown, ResetPasswordRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const resetPasswordSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updateUser(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const updateUserSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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
        });

      await updateUserSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updateAvatar(
    req: Request<unknown, unknown, FileRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const method = (value: string, helpers: CustomHelpers) => {
        const fileMimeType = value.substring('data:'.length, value.indexOf(';base64'));
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

        if (!validMimeTypes.includes(fileMimeType)) {
          return helpers.error('any.invalid');
        } else {
          return value;
        }
      };

      const updateAvatarSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
          file: joi.string().dataUri().trim(true).required().custom(method).label('file').messages({
            'string.base': `The {#label} field should be text`,
            'string.empty': `The {#label} field cannot be empty`,
            'string.dataUri': `The {#label} field should be a valid data uri`,
            'any.invalid': `The {#label} field should be a png, jpg, gif or svg`,
            'any.required': `The {#label} field is required`,
          }),
        });

      await updateAvatarSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }

  @Autobind
  public async updatePassword(
    req: Request<unknown, unknown, AuthRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const request = req.body;

    try {
      const updatePasswordSchema = joi
        .object()
        .options({ allowUnknown: true, abortEarly: false })
        .keys({
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

      await updatePasswordSchema.validateAsync(request);

      next();
    } catch (err) {
      this.handleValidationErrors(err as joi.ValidationError, next);
    }
  }
}
