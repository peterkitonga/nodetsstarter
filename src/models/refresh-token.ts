import { Schema, Model, model } from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

type RefreshTokenModelType = Model<RefreshTokenModel>;

const schema = new Schema<RefreshTokenModel, RefreshTokenModelType>(
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

export default model<RefreshTokenModel, RefreshTokenModelType>('RefreshToken', schema);
