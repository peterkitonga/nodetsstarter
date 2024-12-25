import { Service } from 'typedi';
import { HydratedDocument } from 'mongoose';

import RefreshToken from '@src/models/refresh-token';
import { BaseRepository } from '@src/repositories/base';
import { RefreshTokenModel } from '@src/shared/interfaces/database';

@Service()
export default class RefreshTokenRepository extends BaseRepository<HydratedDocument<RefreshTokenModel>> {
  public async create(doc: Partial<RefreshTokenModel>): Promise<HydratedDocument<RefreshTokenModel>> {
    try {
      const refreshToken: HydratedDocument<RefreshTokenModel> = new RefreshToken(doc);

      return await refreshToken.save();
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, updatedDoc: RefreshTokenModel): Promise<HydratedDocument<RefreshTokenModel>> {
    return {} as HydratedDocument<RefreshTokenModel>;
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

  public async findByIdAndDelete(id: string): Promise<HydratedDocument<RefreshTokenModel> | null> {
    try {
      const refreshToken = await RefreshToken.findById(id);

      await refreshToken!.deleteOne();

      return refreshToken;
    } catch (err) {
      throw err;
    }
  }
}
