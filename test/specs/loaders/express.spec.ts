import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import ExpressApp from '../../../src/loaders/express';
import WinstonLogger from '../../../src/loaders/winston';
import MongooseConnect from '../../../src/loaders/mongoose';

const { expect } = chai;

chai.use(sinonChai);

const sandbox = sinon.createSandbox();

describe('src/loaders/express: class ExpressApp', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('init()', () => {
    let listenStub: sinon.SinonStub;
    let corsMiddlewareStub: sinon.SinonStub;
    let homeRouteStub: sinon.SinonStub;
    let appRoutesStub: sinon.SinonStub;
    let nonExistentRouteStub: sinon.SinonStub;
    let errorHandlingMiddlewareStub: sinon.SinonStub;
    let databaseConnectionStub: sinon.SinonStub;

    beforeEach(() => {
      listenStub = sandbox.stub(ExpressApp, 'listen');
      corsMiddlewareStub = sandbox.stub(ExpressApp, 'setupCors');
      homeRouteStub = sandbox.stub(ExpressApp, 'handleHomeRoute');
      appRoutesStub = sandbox.stub(ExpressApp, 'handleAppRoutes');
      nonExistentRouteStub = sandbox.stub(ExpressApp, 'handleNonExistingRoute');
      errorHandlingMiddlewareStub = sandbox.stub(ExpressApp, 'handleErrorMiddleware');
      databaseConnectionStub = sandbox.stub(ExpressApp, 'connectDatabase');
    });

    it('should initialize server correctly', async () => {
      await ExpressApp.init();

      expect(listenStub).to.be.calledOnce;
    });

    it('should load the cors middleware', async () => {
      await ExpressApp.init();

      expect(corsMiddlewareStub).to.be.calledOnce;
    });

    it('should register a home route', async () => {
      await ExpressApp.init();

      expect(homeRouteStub).to.be.calledOnce;
    });

    it('should register app routes', async () => {
      await ExpressApp.init();

      expect(appRoutesStub).to.be.calledOnce;
    });

    it('should register middleware for non existing routes', async () => {
      await ExpressApp.init();

      expect(nonExistentRouteStub).to.be.calledOnce;
    });

    it('should attach an error handling middleware', async () => {
      await ExpressApp.init();

      expect(errorHandlingMiddlewareStub).to.be.calledOnce;
    });

    it('should connect to a database', async () => {
      await ExpressApp.init();

      expect(databaseConnectionStub).to.be.calledOnce;
    });
  });

  context('connectDatabase()', () => {
    let mongooseConnectStub: sinon.SinonStub;
    let winstonLoggerInfoStub: sinon.SinonStub;
    let winstonLoggerErrorStub: sinon.SinonStub;

    beforeEach(() => {
      mongooseConnectStub = sandbox.stub(MongooseConnect, 'connect');
      winstonLoggerInfoStub = sandbox.stub(WinstonLogger, 'info');
      winstonLoggerErrorStub = sandbox.stub(WinstonLogger, 'error');
    });

    it('should connect to database and log status', async () => {
      const successMessage = 'MONGO CONNECTED';
      mongooseConnectStub.resolves({ status: 'success', message: successMessage });

      await ExpressApp.connectDatabase();

      expect(mongooseConnectStub).to.be.calledOnce;
      expect(winstonLoggerInfoStub).to.be.calledOnce;
      expect(winstonLoggerInfoStub).to.be.calledWith(successMessage);
    });

    it('should catch errors from database', async () => {
      const errorMessage = 'MONGO ERROR';
      mongooseConnectStub.rejects({ status: 'error', message: errorMessage });

      await ExpressApp.connectDatabase();

      expect(mongooseConnectStub).to.be.calledOnce;
      expect(winstonLoggerErrorStub).to.be.calledOnceWith(errorMessage);
    });
  });
});
