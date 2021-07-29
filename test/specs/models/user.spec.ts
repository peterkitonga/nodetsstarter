import chai from 'chai';

import User from '../../../src/models/user';

const { expect } = chai;

describe('src/models/user', () => {
  context('validate()', () => {
    it('should return error if required fields are missing', () => {
      const user = new User();

      const validation = user.validateSync();

      expect(validation!.errors.name).to.exist;
      expect(validation!.errors.email).to.exist;
      expect(validation!.errors.password).to.exist;
      expect(validation!.errors.salt).to.not.exist;
      expect(validation!.errors.avatar).to.not.exist;
      expect(validation!.errors.is_activated).to.not.exist;
    });
  });
});
