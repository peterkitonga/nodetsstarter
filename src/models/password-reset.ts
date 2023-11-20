import { Schema, model } from 'mongoose';
import { PasswordResetModel } from '@src/shared/interfaces/database';

const schema = new Schema<PasswordResetModel>(
  {
    email: { type: String, required: true },
    token: { type: String, required: true },
  },
  {
    collection: 'password_resets',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export default model<PasswordResetModel>('PasswordReset', schema);
