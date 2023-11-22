import { Schema, model } from 'mongoose';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

const schema = new Schema<RefreshTokenModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    collection: 'refresh_tokens',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export default model<RefreshTokenModel>('RefreshToken', schema);
