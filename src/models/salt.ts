import { Schema, model } from 'mongoose';
import { SaltModel } from '@src/shared/interfaces/database';

const schema = new Schema<SaltModel>(
  {
    salt: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export default model<SaltModel>('Salt', schema);
