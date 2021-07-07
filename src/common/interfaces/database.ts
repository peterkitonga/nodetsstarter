import { Document } from 'mongoose';

export interface UserModel extends Document {
  name: string;
  email: string;
  password: string;
  salt: string;
  avatar?: string;
  activation_code?: string;
  activated?: boolean;
}
