import chai from 'chai';

const { expect } = chai;

describe('example test', () => {
  context('add(2, 3)', () => {
    it('should add numbers correctly', () => {
      const num1 = 2;
      const num2 = 3;
      const result = num1 + num2;

      expect(result).to.equal(5);
      expect(result).to.be.a('number');
    });

    it('should not return a result of 6', () => {
      const num1 = 2;
      const num2 = 3;
      const result = num1 + num2;

      expect(result).not.to.equal(6);
      expect(result).to.be.a('number');
    });
  });
});
