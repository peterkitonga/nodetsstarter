import BaseError from './base';
import { HttpStatusCodes } from '../enums/http';

export default class ValidationError<DataType> extends BaseError {
  public constructor(public message: string, public data: DataType) {
    super('ValidationError', HttpStatusCodes.UNPROCESSABLE_ENTITY, message, data);
  }
}
