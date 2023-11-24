import { Service } from 'typedi';

import RefreshToken from '@src/models/refresh-token';
import { BaseRepository } from '@src/repositories/base';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

@Service()
export default class RefreshTokenRepository extends BaseRepository<RefreshTokenModel> {
  public async create(doc: Partial<RefreshTokenModel>): Promise<RefreshTokenModel> {
    try {
      const refreshToken = new RefreshToken(doc);

      return await refreshToken.save();
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, updatedDoc: RefreshTokenModel): Promise<RefreshTokenModel> {
    return {} as RefreshTokenModel;
  }

  public async delete(field: string, value: string, docCount: 'one' | 'many' = 'one'): Promise<boolean> {
    try {
      const filter = this.buildFilterObject(field, value);

      if (docCount === 'one') {
        await RefreshToken.deleteOne(filter);
      } else {
        await RefreshToken.deleteMany(filter);
      }

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async findByIdAndDelete(id: string): Promise<RefreshTokenModel | null> {
    try {
      return await RefreshToken.findByIdAndDelete(id);
    } catch (err) {
      throw err;
    }
  }
}
