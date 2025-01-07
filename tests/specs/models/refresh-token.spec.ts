import { Error as MongooseError } from 'mongoose';
import RefreshToken from '@src/models/refresh-token';

describe('src/models/refresh-token', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('should return error if required fields are missing', () => {
      const refreshToken = new RefreshToken();

      const validation = refreshToken.validateSync() as MongooseError.ValidationError;

      expect(validation.errors.user).toHaveProperty('message', 'Path `user` is required.');
      expect(validation.errors.expiresAt).toHaveProperty('message', 'Path `expiresAt` is required.');
    });
  });

  describe('toJSON()', () => {
    it('should remove defined fields from the fetched document', async () => {
      const existingRefreshToken = {
        _id: '123456',
        user: {
          _id: '789101',
          name: 'Test',
          email: 'user@test.com',
          password: 'SAMPLE_HASH',
          isActivated: false,
          avatar: 'https://fakeimg.pl/440x440/282828/eae0d0/?retina=1',
        },
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      };

      // @ts-ignore
      RefreshToken.schema.get('toJSON')!.transform({}, existingRefreshToken);

      expect(existingRefreshToken).not.toHaveProperty('updatedAt');
      expect(existingRefreshToken).not.toHaveProperty('__v');
    });
  });
});
