import BaseError from '@src/shared/errors/base';
import { HttpStatusCodes } from '@src/shared/enums';

export default class ForbiddenError extends BaseError {
  public constructor(public message: string) {
    super('ForbiddenError', HttpStatusCodes.FORBIDDEN, message);
  }
}
