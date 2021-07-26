import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import ExpressApp from '../../../../src/loaders/express';

const { expect } = chai;

chai.use(sinonChai); // imports chai plugin

const sandbox = sinon.createSandbox();

describe('ExpressApp: src/loaders/express', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('init()', () => {
    let listenStub: sinon.SinonStub;

    beforeEach(() => {
      listenStub = sandbox.stub(ExpressApp, 'listen');
    });

    it('should initialize server correctly', (done) => {
      ExpressApp.init();

      expect(listenStub).to.be.calledOnce;
      done();
    });
  });
});
