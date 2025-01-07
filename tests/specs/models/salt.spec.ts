import { Error as MongooseError } from 'mongoose';
import Salt from '@src/models/salt';

describe('src/models/salt', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('should return error if required fields are missing', () => {
      const salt = new Salt();

      const validation = salt.validateSync() as MongooseError.ValidationError;

      expect(validation.errors.salt).toHaveProperty('message', 'Path `salt` is required.');
      expect(validation.errors.user).toHaveProperty('message', 'Path `user` is required.');
    });
  });

  describe('toJSON()', () => {
    it('should remove defined fields from the fetched document', async () => {
      const existingSalt = {
        _id: '123456',
        salt: 'SAMPLE_SALT',
        user: {
          _id: '789101',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          isActivated: false,
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      };

      // @ts-ignore
      Salt.schema.get('toJSON')!.transform({}, existingSalt);

      expect(existingSalt).not.toHaveProperty('updatedAt');
      expect(existingSalt).not.toHaveProperty('__v');
    });
  });
});
