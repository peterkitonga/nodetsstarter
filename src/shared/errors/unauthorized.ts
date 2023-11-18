import BaseError from '@src/shared/errors/base';
import { HttpStatusCodes } from '@src/shared/enums';

export default class UnauthorizedError extends BaseError {
  public constructor(public message: string) {
    super('UnauthorizedError', HttpStatusCodes.UNAUTHORIZED, message);
  }
}
