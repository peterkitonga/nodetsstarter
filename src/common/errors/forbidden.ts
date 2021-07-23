import BaseError from './base';
import { HttpStatusCodes } from '../enums/http';

export default class ForbiddenError extends BaseError {
  public constructor(public message: string) {
    super('ForbiddenError', HttpStatusCodes.FORBIDDEN, true, message);
  }
}
