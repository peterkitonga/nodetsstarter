import chai from 'chai';

import Salt from '../../../src/models/salt';

const { expect } = chai;

describe('src/models/salt', () => {
  context('validate()', () => {
    it('should return error if required fields are missing', () => {
      const salt = new Salt();

      const validation = salt.validateSync();

      expect(validation!.errors.salt).to.exist;
      expect(validation!.errors.user).to.exist;
    });
  });
});
