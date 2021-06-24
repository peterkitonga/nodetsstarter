import { Schema, model } from 'mongoose';
import { UserModel } from '../interfaces/database';

const schema = new Schema<UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: String,
    avatar: String,
    activation_code: String,
    activated: Boolean,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export default model<UserModel>('User', schema);
