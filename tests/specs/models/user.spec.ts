import { Error as MongooseError } from 'mongoose';
import User from '@src/models/user';

describe('src/models/user', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('should return error if required fields are missing', () => {
      const user = new User();

      const validation = user.validateSync() as MongooseError.ValidationError;

      expect(validation.errors.name).toHaveProperty('message', 'Path `name` is required.');
      expect(validation.errors.email).toHaveProperty('message', 'Path `email` is required.');
      expect(validation.errors.password).toHaveProperty('message', 'Path `password` is required.');
      expect(validation.errors.avatar).toBeFalsy();
      expect(validation.errors.isActivated).toBeFalsy();
    });
  });

  describe('toJSON()', () => {
    it('should remove defined fields from the fetched document', async () => {
      const existingUser = {
        _id: '789101',
        name: 'Test',
        email: 'user@test.com',
        password: 'SAMPLE_HASH',
        isActivated: false,
        avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      };

      // @ts-ignore
      User.schema.get('toJSON')!.transform({}, existingUser);

      expect(existingUser).not.toHaveProperty('updatedAt');
      expect(existingUser).not.toHaveProperty('__v');
    });
  });
});
