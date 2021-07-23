import { Document } from 'mongoose';

export interface UserModel extends Document {
  name: string;
  email: string;
  password: string;
  salt: string;
  avatar?: string;
  is_activated?: boolean;
  created_at?: boolean;
}
