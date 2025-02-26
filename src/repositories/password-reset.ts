import { Service } from 'typedi';
import { HydratedDocument } from 'mongoose';

import PasswordReset from '@src/models/password-reset';
import { BaseRepository } from '@src/repositories/base';
import { PasswordResetModel } from '@src/shared/interfaces/database';

@Service()
export default class PasswordResetRepository extends BaseRepository<HydratedDocument<PasswordResetModel>> {
  public async create(doc: Partial<PasswordResetModel>): Promise<boolean> {
    try {
      const passwordReset: HydratedDocument<PasswordResetModel> = new PasswordReset(doc);
      await passwordReset.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, updatedDoc: PasswordResetModel): Promise<HydratedDocument<PasswordResetModel>> {
    return {} as HydratedDocument<PasswordResetModel>;
  }

  public async delete(field: string, value: string): Promise<boolean> {
    try {
      const filter = this.buildFilterObject(field, value);

      await PasswordReset.deleteOne(filter);

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async findByToken(token: string): Promise<HydratedDocument<PasswordResetModel> | null> {
    try {
      return await PasswordReset.findOne({ token });
    } catch (err) {
      throw err;
    }
  }
}
