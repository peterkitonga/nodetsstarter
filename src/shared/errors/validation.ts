import BaseError from '@src/shared/errors/base';
import { HttpStatusCodes } from '@src/shared/enums';

export default class ValidationError<DataType> extends BaseError {
  public constructor(public message: string, public data: DataType) {
    super('ValidationError', HttpStatusCodes.UNPROCESSABLE_ENTITY, message, data);
  }
}
