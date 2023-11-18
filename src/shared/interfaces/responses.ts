import { UserModel } from './database';

export interface AppResponse<DataType> {
  status: string; // possible values: success, error, warning, info
  message?: string;
  data?: DataType;
}

export interface TokenResponse {
  token: string;
  refresh_token: string;
  lifetime: string;
  auth: Partial<UserModel>;
}
