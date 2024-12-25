export interface UserModel {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  isActivated?: boolean;
  createdAt?: string;
}

export interface SaltModel {
  _id: string;
  salt: string;
  user: UserModel | string;
  createdAt?: string;
}

export interface PasswordResetModel {
  _id: string;
  email: string;
  token: string;
  createdAt?: string;
}

export interface RefreshTokenModel {
  _id: string;
  user: UserModel | string;
  createdAt?: string;
  expiresAt?: string;
}
