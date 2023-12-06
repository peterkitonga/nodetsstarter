import { Schema, model } from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

const schema = new Schema<RefreshTokenModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { maxDepth: 1, select: '-password' } },
    expiresAt: { type: Date, required: true },
  },
  {
    collection: 'refresh_tokens',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

schema.plugin(mongooseAutopopulate);

schema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.updatedAt;
    delete returnedObject.__v;
  },
});

export default model<RefreshTokenModel>('RefreshToken', schema);
