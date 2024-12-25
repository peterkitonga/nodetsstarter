import { Service } from 'typedi';
import { HydratedDocument } from 'mongoose';

import Salt from '@src/models/salt';
import { BaseRepository } from '@src/repositories/base';
import { SaltModel } from '@src/shared/interfaces/database';

@Service()
export default class SaltRepository extends BaseRepository<HydratedDocument<SaltModel>> {
  public async create(doc: Partial<SaltModel>): Promise<boolean> {
    try {
      const newSalt = new Salt(doc);
      await newSalt.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, doc: SaltModel): Promise<HydratedDocument<SaltModel>> {
    return {} as HydratedDocument<SaltModel>;
  }

  public async delete(field: string, value: string, docCount: 'one' | 'many' = 'one'): Promise<boolean> {
    try {
      const filter = this.buildFilterObject(field, value);

      if (docCount === 'one') {
        await Salt.deleteOne(filter);
      } else {
        await Salt.deleteMany(filter);
      }

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async findBySalt(salt: string): Promise<HydratedDocument<SaltModel> | null> {
    try {
      return await Salt.findOne({ salt });
    } catch (err) {
      throw err;
    }
  }

  public async isValid(salt: string): Promise<{ _id: string } | null> {
    try {
      return await Salt.exists({ salt });
    } catch (err) {
      throw err;
    }
  }
}
