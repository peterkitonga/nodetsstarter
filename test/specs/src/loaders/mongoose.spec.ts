import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import sinonChai from 'sinon-chai';
import dotenvExpand from 'dotenv-expand';
import chaiAsPromised from 'chai-as-promised';

dotenvExpand(dotenv.config({ path: path.join(__dirname, '../../../../.env') }));

import configs from '../../../../src/configs';
import MongooseConnect from '../../../../src/loaders/mongoose';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();

describe('src/loaders/mongoose: class MongooseConnect', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('connect()', () => {
    let mongooseConnectStub: sinon.SinonStub;

    beforeEach(() => {
      mongooseConnectStub = sandbox.stub(mongoose, 'connect');
    });

    it('should connect to database with uri string from env', async () => {
      mongooseConnectStub.resolves();

      const connectionResponse = await MongooseConnect.connect();

      expect(mongooseConnectStub).to.be.calledOnceWith(configs.database.uri());
      expect(connectionResponse).to.have.deep.property('status').to.equal('success');
    });

    it('should return success message after successful database connection', async () => {
      mongooseConnectStub.resolves();

      const connectionResponse = await MongooseConnect.connect();

      expect(connectionResponse).to.have.deep.property('status').to.equal('success');
      expect(connectionResponse).to.have.deep.property('message').to.equal('MONGO CONNECTED!');
    });
  });

  context('disconnect()', () => {
    let mongooseConnectionStub: sinon.SinonStub;

    beforeEach(() => {
      mongooseConnectionStub = sandbox.stub(mongoose.connection, 'close');
    });

    it('should disconnect application from database correctly', async () => {
      mongooseConnectionStub.resolves();

      await MongooseConnect.disconnect();

      expect(mongooseConnectionStub).to.be.calledOnceWith(false);
    });

    it('should return success message after successfully disconnecting from database', async () => {
      mongooseConnectionStub.resolves();

      const disconnectResponse = await MongooseConnect.disconnect();

      expect(disconnectResponse).to.have.deep.property('status').to.equal('success');
    });
  });
});
