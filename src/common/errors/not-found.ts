import BaseError from './base';
import { HttpStatusCodes } from '../enums/http';

export default class NotFoundError extends BaseError {
  public constructor(public message: string) {
    super('NotFoundError', HttpStatusCodes.NOT_FOUND, true, message);
  }
}
