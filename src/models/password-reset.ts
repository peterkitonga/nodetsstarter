import { Schema, Model, model } from 'mongoose';
import { PasswordResetModel } from '@src/shared/interfaces/database';

type PasswordResetModelType = Model<PasswordResetModel>;

const schema = new Schema<PasswordResetModel, PasswordResetModelType>(
  {
    email: { type: String, required: true },
    token: { type: String, required: true },
  },
  {
    collection: 'password_resets',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

schema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.updatedAt;
    delete returnedObject.__v;
  },
});

export default model<PasswordResetModel, PasswordResetModelType>('PasswordReset', schema);
