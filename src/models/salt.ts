import { Schema, Model, model } from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { SaltModel } from '@src/shared/interfaces/database';

type SaltModelType = Model<SaltModel>;

const schema = new Schema<SaltModel, SaltModelType>(
  {
    salt: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: { maxDepth: 1, select: '-password' } },
  },
  {
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

export default model<SaltModel, SaltModelType>('Salt', schema);
