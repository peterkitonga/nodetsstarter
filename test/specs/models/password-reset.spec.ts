import chai from 'chai';

import PasswordReset from '../../../src/models/password-reset';

const { expect } = chai;

describe('src/models/password-reset', () => {
  context('validate()', () => {
    it('should return error if required fields are missing', () => {
      const passwordReset = new PasswordReset();

      const validation = passwordReset.validateSync();

      expect(validation!.errors.email).to.exist;
      expect(validation!.errors.token).to.exist;
    });
  });
});
