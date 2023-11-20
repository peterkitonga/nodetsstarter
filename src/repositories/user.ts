import { Service } from 'typedi';

import User from '@src/models/user';
import NotFoundError from '@src/shared/errors/not-found';
import { UserModel } from '@src/shared/interfaces/database';

@Service()
export default class UserRepository extends BaseRepository<UserModel> {
  public async create(doc: UserModel): Promise<boolean> {
    try {
      const newUser = new User(doc);
      await newUser.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(field: string, value: string, doc: UserModel): Promise<UserModel> {
    try {
      let user: UserModel | null;

      if (field === '_id') {
        user = await this.findById(value);
      } else {
        const filter = this.buildFilterObject(field, value);

        user = await User.findOne(filter);
      }

      if (!user) {
        throw new NotFoundError(`User with ${field} ${value} not found.`);
      }

      for (const key in doc) {
        // @ts-ignore
        user[key] = doc[key];
      }

      await user.save();

      return user;
    } catch (err) {
      throw err;
    }
  }

  public async delete(field: string, value: string): Promise<boolean> {
    try {
      const filter = this.buildFilterObject(field, value);

      await User.deleteOne(filter);

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async findByEmail(email: string): Promise<UserModel | null> {
    try {
      return await User.findOne({ email });
    } catch (err) {
      throw err;
    }
  }

  public async findById(identifier: UserModel | string): Promise<UserModel | null> {
    try {
      return await User.findById(identifier);
    } catch (err) {
      throw err;
    }
  }

  public async isRegistered(email: string): Promise<boolean> {
    try {
      return await User.exists({ email });
    } catch (err) {
      throw err;
    }
  }
}
