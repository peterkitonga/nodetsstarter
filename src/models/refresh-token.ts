import { Schema, model } from 'mongoose';
import { RefreshTokenModel } from '../common/interfaces/database';

const schema = new Schema<RefreshTokenModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export default model<RefreshTokenModel>('RefreshToken', schema);
