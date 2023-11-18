import BaseError from '@src/shared/errors/base';
import { HttpStatusCodes } from '@src/shared/enums';

export default class NotFoundError extends BaseError {
  public constructor(public message: string) {
    super('NotFoundError', HttpStatusCodes.NOT_FOUND, message);
  }
}
