import { Schema, model } from 'mongoose';
import { PasswordResetModel } from '../common/interfaces/database';

const schema = new Schema<PasswordResetModel>(
  {
    email: { type: String, required: true },
    token: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export default model<PasswordResetModel>('PasswordReset', schema);
