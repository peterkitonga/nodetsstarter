import { UserModel } from './database';

export interface ResultResponse<DataType> {
  status: string; // possible values: success, error, warning, info
  message?: string;
  data?: DataType;
}

export interface TokenResponse {
  token: string;
  lifetime: string;
  auth: UserModel;
}
