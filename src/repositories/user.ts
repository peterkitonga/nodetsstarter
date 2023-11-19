import { UserModel } from '@src/shared/interfaces/database';
import { Service } from 'typedi';
import User from '@src/models/user';

@Service()
export default class UserRepository implements BaseRepository<UserModel> {
  public async create(item: UserModel): Promise<boolean> {
    try {
      const newUser = new User(item);
      await newUser.save();

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async update(identifier: string, item: UserModel): Promise<boolean> {
    return Promise.resolve(false);
  }

  public async delete(identifier: string): Promise<boolean> {
    return Promise.resolve(false);
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
