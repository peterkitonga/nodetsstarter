import { Service } from 'typedi';

import Salt from '@src/models/salt';
import { SaltModel } from '@src/shared/interfaces/database';

@Service()
export default class SaltRepository implements BaseRepository<SaltModel> {
  public async create(doc: SaltModel): Promise<boolean> {
    try {
      const newSalt = new Salt(doc);
      await newSalt.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, doc: SaltModel): Promise<SaltModel> {
    return {} as SaltModel;
  }

  public async delete(field: string, value: string): Promise<boolean> {
    try {
      const filter = {} as { [key: string]: string };
      filter[field] = value;

      await Salt.deleteOne(filter);

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async deleteMany(field: string, value: string): Promise<boolean> {
    try {
      const filter = {} as { [key: string]: string };
      filter[field] = value;

      await Salt.deleteMany(filter);

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async findBySalt(salt: string): Promise<SaltModel | null> {
    try {
      return await Salt.findOne({ salt });
    } catch (err) {
      throw err;
    }
  }

  public async isValid(salt: string): Promise<boolean> {
    try {
      return await Salt.exists({ salt });
    } catch (err) {
      throw err;
    }
  }
}
