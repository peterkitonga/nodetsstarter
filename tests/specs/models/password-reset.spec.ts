import { Error as MongooseError } from 'mongoose';
import PasswordReset from '@src/models/password-reset';

describe('src/models/password-reset', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('should return error if required fields are missing', () => {
      const passwordReset = new PasswordReset();

      const validation = passwordReset.validateSync() as MongooseError.ValidationError;

      expect(validation.errors.email).toHaveProperty('message', 'Path `email` is required.');
      expect(validation.errors.token).toHaveProperty('message', 'Path `token` is required.');
    });
  });

  describe('toJSON()', () => {
    it('should remove defined fields from the fetched document', async () => {
      const existingPasswordReset = {
        _id: '123456',
        email: 'user@test.com',
        token: 'SAMPLE_TOKEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      };

      // @ts-ignore
      PasswordReset.schema.get('toJSON')!.transform({}, existingPasswordReset);

      expect(existingPasswordReset).not.toHaveProperty('updatedAt');
      expect(existingPasswordReset).not.toHaveProperty('__v');
    });
  });
});
