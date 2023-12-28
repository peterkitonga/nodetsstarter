import { UserModel } from './database';

export interface AppResponse<DataType> {
  message?: string;
  data?: DataType;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  lifetime: string;
  auth: Partial<UserModel>;
}
