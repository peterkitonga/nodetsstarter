import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import { readFileSync } from 'fs';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import SThreeClient from '../../../src/loaders/aws-sthree';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const rawFiledata = readFileSync(path.resolve(__dirname, '../../dummy-file.json'), 'utf-8');
const fileData = JSON.parse(rawFiledata);
const fileName = `${Date.now()}.jpeg`;
const fileContent = fileData.image;

describe('src/loaders/aws-sthree: class SThreeClient', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('saveToBucket()', () => {
    let clientSendStub: sinon.SinonStub;

    beforeEach(() => {
      clientSendStub = sandbox.stub(SThreeClient['client'], 'send');
    });

    it('should return success message on successful upload to s3', async () => {
      clientSendStub.resolves();

      const regex = new RegExp(`Successfully uploaded '${fileName}'`);
      const base64File = fileContent.split(';base64,').pop();
      const uploadResponse = await SThreeClient.saveToBucket(
        fileName,
        'image/jpeg',
        Buffer.from(base64File!, 'base64'),
      );

      expect(uploadResponse).to.have.deep.property('status').to.equal('success');
      expect(uploadResponse).to.have.deep.property('message').to.match(regex);
      expect(clientSendStub).to.have.been.calledOnce;
    });

    it('should catch errors on unsuccessful upload to s3', async () => {
      clientSendStub.rejects(new Error('SOME ERROR'));

      const base64File = fileContent.split(';base64,').pop();

      await expect(SThreeClient.saveToBucket(fileName, 'image/jpeg', Buffer.from(base64File!, 'base64'))).to.eventually
        .be.rejected;
      expect(clientSendStub).to.have.been.calledOnce;
    });
  });

  context('deleteFromBucket()', () => {
    let clientSendStub: sinon.SinonStub;

    beforeEach(() => {
      clientSendStub = sandbox.stub(SThreeClient['client'], 'send');
    });

    it('should return success message on successful deletion from s3', async () => {
      clientSendStub.resolves();

      const regex = new RegExp(`Successfully deleted '${fileName}'`);
      const deletionResponse = await SThreeClient.deleteFromBucket(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('success');
      expect(deletionResponse).to.have.deep.property('message').to.match(regex);
      expect(clientSendStub).to.have.been.calledOnce;
    });

    it('should catch errors on unsuccessful deletion from s3', async () => {
      clientSendStub.rejects(new Error('SOME ERROR'));

      await expect(SThreeClient.deleteFromBucket(fileName)).to.eventually.be.rejected;
      expect(clientSendStub).to.have.been.calledOnce;
    });
  });
});
