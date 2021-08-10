import chai from 'chai';

import RefreshToken from '../../../src/models/refresh-token';

const { expect } = chai;

describe('src/models/refresh-token', () => {
  context('validate()', () => {
    it('should return error if required fields are missing', () => {
      const refreshToken = new RefreshToken();

      const validation = refreshToken.validateSync();

      expect(validation!.errors.user).to.exist;
      expect(validation!.errors.expired_at).to.exist;
    });
  });
});
