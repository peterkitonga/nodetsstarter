import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import winston from 'winston';

import configs from '../../../src/configs';
import WinstonLogger from '../../../src/loaders/winston';

const { expect } = chai;

chai.use(sinonChai);

const sandbox = sinon.createSandbox();

describe('src/loaders/winston: class WinstonLogger', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('extendTransports()', () => {
    let envStub: sinon.SinonStub;
    let loggerAddStub: sinon.SinonStub;

    beforeEach(() => {
      envStub = sandbox.stub(configs.app, 'env');
      loggerAddStub = sandbox.stub(WinstonLogger['logger'], 'add');
    });

    it('should add file transport if NODE_ENV is set to "production"', () => {
      envStub.value('production');

      WinstonLogger.extendTransports();
      const lastArgument = loggerAddStub.getCall(0).args[0];

      expect(loggerAddStub).to.have.been.calledOnce;
      expect(lastArgument).to.exist.and.be.an.instanceOf(winston.transports.File);
    });

    it('should add console transport if NODE_ENV is set to "development"', () => {
      envStub.value('development');

      WinstonLogger.extendTransports();
      const lastArgument = loggerAddStub.getCall(0).args[0];

      expect(loggerAddStub).to.have.been.calledOnce;
      expect(lastArgument).to.exist.and.be.an.instanceOf(winston.transports.Console);
    });
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
