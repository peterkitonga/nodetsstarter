import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import configs from '../../../src/configs';

const { expect } = chai;

chai.use(sinonChai);

const sandbox = sinon.createSandbox();

describe('src/configs/database', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('uri()', () => {
    let databaseProviderStub: sinon.SinonStub;

    beforeEach(() => {
      databaseProviderStub = sandbox.stub(configs.database, 'provider');
    });

    it('should return atlas uri if provider is set to "atlas"', () => {
      databaseProviderStub.value('atlas');
      const regex = new RegExp('retryWrites=true&w=majority');

      const databaseUriResult = configs.database.uri();

      expect(databaseUriResult).to.exist.and.match(regex);
    });

    it('should return local database uri if provider is set to "local"', () => {
      databaseProviderStub.value('local');
      const regex = new RegExp('retryWrites=true&w=majority');

      const databaseUriResult = configs.database.uri();

      expect(databaseUriResult).to.exist.and.not.match(regex);
    });
  });
});
