import { Document } from 'mongoose';

export interface UserModel extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  isActivated?: boolean;
  createdAt?: string;
}

export interface SaltModel extends Document {
  _id: string;
  salt: string;
  user: UserModel;
  createdAt?: string;
}

export interface PasswordResetModel extends Document {
  _id: string;
  email: string;
  token: string;
  created_at?: string;
}

export interface RefreshTokenModel extends Document {
  _id: string;
  user: UserModel;
  created_at?: string;
  expires_at?: string;
}
