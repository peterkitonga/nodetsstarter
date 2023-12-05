import * as mongoose from 'mongoose';
import { NextFunction } from 'express';
import joi, { CustomHelpers } from 'joi';

import ValidationError from '@src/shared/errors/validation';

export default class BaseValidator {
  public idValidationSchema(label: string): joi.StringSchema {
    return joi
      .string()
      .min(24)
      .max(24)
      .trim(true)
      .custom(this.objectIdValidator)
      .messages({
        'string.base': `The {#label} field should be a string`,
        'string.empty': `The {#label} field cannot be empty`,
        'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
        'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
        'any.invalid': `The {#label} field should be a valid id`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public stringValidationSchema(label: string, min = 3, max = 255): joi.StringSchema {
    return joi
      .string()
      .min(min)
      .max(max)
      .trim(true)
      .messages({
        'string.base': `The {#label} field should be a string`,
        'string.empty': `The {#label} field cannot be empty`,
        'string.min': `The {#label} field should have a minimum length of {#limit} characters`,
        'string.max': `The {#label} field should have a maximum length of {#limit} characters`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public emailValidationSchema(label: string, min = 3, max = 255): joi.StringSchema {
    return joi
      .string()
      .email()
      .trim(true)
      .messages({
        'string.base': `The {#label} field should be text`,
        'string.empty': `The {#label} field cannot be empty`,
        'string.email': `The {#label} field should be a valid email`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public numberValidationSchema(label: string): joi.NumberSchema {
    return joi
      .number()
      .messages({
        'number.base': `The {#label} field should be a number`,
        'number.min': `The {#label} field should have a minimum of {#limit}`,
        'number.max': `The {#label} field should have a maximum of {#limit}`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public dateValidationSchema(label: string): joi.StringSchema {
    return joi
      .string()
      .isoDate()
      .messages({
        'string.base': `The {#label} field should be a date string`,
        'string.isoDate': `The {#label} field should have a valid ISO date format`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public booleanValidationSchema(label: string): joi.BooleanSchema {
    return joi
      .bool()
      .messages({
        'bool.base': `The {#label} field should be true/false`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public confirmValidationSchema(label: string, ref: string): joi.AnySchema {
    return joi
      .any()
      .equal(joi.ref(ref))
      .options({
        messages: {
          'any.required': `The {#label} field is required`,
          'any.only': `The {#label} field should match the ${ref} field`,
        },
      })
      .label(label);
  }

  public imageValidationSchema(label: string): joi.StringSchema {
    return joi
      .string()
      .dataUri()
      .trim(true)
      .custom(this.imageValidator)
      .messages({
        'string.base': `The {#label} field should be a string`,
        'string.empty': `The {#label} field cannot be empty`,
        'string.dataUri': `The {#label} field should be a valid data uri`,
        'any.invalid': `The {#label} field should be a png, jpg, gif or svg`,
        'any.required': `The {#label} field is required`,
      })
      .label(label);
  }

  public handleValidationErrors(error: joi.ValidationError, next: NextFunction): void {
    const messages = error.details;
    const formattedMessages = [] as Record<string, string>[];

    for (const message of messages) {
      formattedMessages.push({
        field: message['context']!['label']!,
        message: message['message'],
      });
    }

    return next(new ValidationError('There are validation errors in your request.', formattedMessages));
  }

  private objectIdValidator(value: string, helpers: CustomHelpers): joi.ErrorReport | string {
    const isValidId = mongoose.Types.ObjectId.isValid(value);

    if (isValidId) {
      return value;
    } else {
      return helpers.error('any.invalid');
    }
  }

  private imageValidator(value: string, helpers: CustomHelpers): joi.ErrorReport | string {
    const fileMimeType = value.substring('data:'.length, value.indexOf(';base64'));
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

    if (!validMimeTypes.includes(fileMimeType)) {
      return helpers.error('any.invalid');
    } else {
      return value;
    }
  }
}
