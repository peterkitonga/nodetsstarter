import { Schema, model } from 'mongoose';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

const schema = new Schema<RefreshTokenModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expires_at: { type: Date, required: true },
  },
  {
    collection: 'refresh_tokens',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export default model<RefreshTokenModel>('RefreshToken', schema);
