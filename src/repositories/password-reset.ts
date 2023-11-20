import { Service } from 'typedi';

import PasswordReset from '@src/models/password-reset';
import { PasswordResetModel } from '@src/shared/interfaces/database';

@Service()
export default class PasswordResetRepository extends BaseRepository<PasswordResetModel> {
  public async create(doc: PasswordResetModel): Promise<boolean> {
    try {
      const passwordReset = new PasswordReset(doc);
      await passwordReset.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, updatedDoc: PasswordResetModel): Promise<PasswordResetModel> {
    return {} as PasswordResetModel;
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

  public async findByToken(token: string): Promise<PasswordResetModel | null> {
    try {
      return await PasswordReset.findOne({ token });
    } catch (err) {
      throw err;
    }
  }
}
