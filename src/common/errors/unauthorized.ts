import BaseError from './base';
import { HttpStatusCodes } from '../enums/http';

export default class UnauthorizedError extends BaseError {
  public constructor(public message: string) {
    super('UnauthorizedError', HttpStatusCodes.UNAUTHORIZED, message);
  }
}
