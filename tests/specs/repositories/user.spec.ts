import { Container } from 'typedi';

import User from '@src/models/user';
import UserRepository from '@src/repositories/user';

describe('src/repositories/user', () => {
  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('create()', () => {
    describe('success', () => {
      it('should create a user with the provided details', async () => {
        const newUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          isActivated: false,
        };
        const mockUserSave = jest.fn().mockResolvedValueOnce({
          ...newUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        User.prototype.save = mockUserSave;

        await Container.get(UserRepository).create(newUser);

        expect(mockUserSave).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should catch errors while saving user details', async () => {
        const newUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          isActivated: false,
        };

        User.prototype.save = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SAVE_ERROR'));

        await expect(Container.get(UserRepository).create(newUser)).rejects.toHaveProperty('message', 'SAMPLE_SAVE_ERROR');
      });
    });
  });

  describe('update()', () => {
    describe('success', () => {
      it('should find the user using the "_id" before saving updated details', async () => {
        const userId = '123456';
        const url = 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          avatar: '',
          isActivated: false,
        };
        const mockUserFind = jest.fn().mockResolvedValueOnce({
          ...existingUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          save: jest.fn().mockResolvedValueOnce({
            ...existingUser,
            _id: '12345',
            avatar: url,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });

        User.findById = mockUserFind;

        await Container.get(UserRepository).update('_id', userId, { avatar: url });

        expect(mockUserFind).toHaveBeenCalledWith(userId);
      });

      it('should find the user using other unique identifiers before saving updated details', async () => {
        const userEmail = 'user@test.com';
        const hashedPassword = 'NEW_HASHED_PASSWORD';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          isActivated: false,
        };
        const mockUserFind = jest.fn().mockResolvedValueOnce({
          ...existingUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          save: jest.fn().mockResolvedValueOnce({
            ...existingUser,
            _id: '12345',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });

        User.findOne = mockUserFind;

        await Container.get(UserRepository).update('email', userEmail, { password: hashedPassword });

        expect(mockUserFind).toHaveBeenCalledWith({ email: userEmail });
      });
    });

    describe('error', () => {
      it('should return an error message if the user is not found', async () => {
        const userId = '123456';
        const url = 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1';

        User.findById = jest.fn().mockResolvedValueOnce(null);

        await expect(Container.get(UserRepository).update('_id', userId, { avatar: url })).rejects.toHaveProperty('message', `User with _id ${userId} not found.`);
      });
    });
  });

  describe('delete()', () => {
    describe('success', () => {
      it('should delete a user using the provided identifier', async () => {
        const userEmail = 'user@test.com';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          isActivated: false,
        };
        const mockUserDelete = jest.fn().mockResolvedValueOnce({
          ...existingUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        User.deleteOne = mockUserDelete;

        await Container.get(UserRepository).delete('email', userEmail);

        expect(mockUserDelete).toHaveBeenCalledWith({ email: userEmail });
      });
    });

    describe('error', () => {
      it('should catch errors during user deletion', async () => {
        const userEmail = 'user@test.com';

        User.deleteOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_DELETE_ERROR'));

        await expect(Container.get(UserRepository).delete('email', userEmail)).rejects.toHaveProperty('message', 'SAMPLE_USER_DELETE_ERROR');
      });
    });
  });

  describe('findByEmail()', () => {
    describe('success', () => {
      it('should find a user with the provided email', async () => {
        const userEmail = 'user@test.com';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          isActivated: false,
        };
        const mockUserFind = jest.fn().mockResolvedValueOnce({
          ...existingUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        User.findOne = mockUserFind;

        await Container.get(UserRepository).findByEmail(userEmail);

        expect(mockUserFind).toHaveBeenCalledWith({ email: userEmail });
      });
    });

    describe('error', () => {
      it('should catch errors while fetching the user details', async () => {
        const userEmail = 'user@test.com';

        User.findOne = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_FIND_ERROR'));

        await expect(Container.get(UserRepository).findByEmail(userEmail)).rejects.toHaveProperty('message', 'SAMPLE_USER_FIND_ERROR');
      });
    });
  });

  describe('findById()', () => {
    describe('success', () => {
      it('should find a user with the provided id', async () => {
        const userId = '12345';
        const existingUser = {
          name: 'Test',
          email: 'user@test.com',
          password: 'HASHED_PASSWORD',
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
          isActivated: false,
        };
        const mockUserFind = jest.fn().mockResolvedValueOnce({
          ...existingUser,
          _id: '12345',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        User.findById = mockUserFind;

        await Container.get(UserRepository).findById(userId);

        expect(mockUserFind).toHaveBeenCalledWith(userId);
      });
    });

    describe('error', () => {
      it('should catch errors while fetching the user details', async () => {
        const userId = '12345';

        User.findById = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_FIND_ERROR'));

        await expect(Container.get(UserRepository).findById(userId)).rejects.toHaveProperty('message', 'SAMPLE_USER_FIND_ERROR');
      });
    });
  });

  describe('isRegistered()', () => {
    describe('success', () => {
      it('should check if a user with the provided email exists', async () => {
        const userEmail = 'user@test.com';
        const mockUserExists = jest.fn().mockResolvedValueOnce({
          _id: '12345',
        });

        User.exists = mockUserExists;

        await Container.get(UserRepository).isRegistered(userEmail);

        expect(mockUserExists).toHaveBeenCalledWith({ email: userEmail });
      });
    });

    describe('error', () => {
      it('should catch errors while fetching the user details', async () => {
        const userEmail = 'user@test.com';

        User.exists = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_USER_EXISTS_ERROR'));

        await expect(Container.get(UserRepository).isRegistered(userEmail)).rejects.toHaveProperty('message', 'SAMPLE_USER_EXISTS_ERROR');
      });
    });
  });
});
