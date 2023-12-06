import { Schema, model } from 'mongoose';
import { UserModel } from '@src/shared/interfaces/database';

const schema = new Schema<UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: String,
    isActivated: Boolean,
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

schema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.updatedAt;
    delete returnedObject.__v;
  },
});

export default model<UserModel>('User', schema);
