import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import WinstonLogger from '../../../src/loaders/winston';

const { expect } = chai;

chai.use(sinonChai);

const sandbox = sinon.createSandbox();

describe('src/loaders/winston: class WinstonLogger', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('info()', () => {
    let winstonInfoStub: sinon.SinonStub;

    beforeEach(() => {
      winstonInfoStub = sandbox.stub(WinstonLogger['logger'], 'info');
    });

    it('should expect message as a string', () => {
      const logMessage = 'SOME MESSAGE';

      WinstonLogger.info(logMessage);

      expect(winstonInfoStub).to.have.been.calledOnceWith(logMessage);
    });
  });

  context('error()', () => {
    let winstonErrorStub: sinon.SinonStub;

    beforeEach(() => {
      winstonErrorStub = sandbox.stub(WinstonLogger['logger'], 'error');
    });

    it('should expect message as a string', () => {
      const logMessage = 'SOME MESSAGE';

      WinstonLogger.error(logMessage);

      expect(winstonErrorStub).to.have.been.calledOnceWith(logMessage);
    });
  });
});
