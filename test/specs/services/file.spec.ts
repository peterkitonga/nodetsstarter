import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import configs from '../../../src/configs';
import SThreeClient from '../../../src/loaders/aws-sthree';
import FileStorageService from '../../../src/services/file';
import { ResultResponse } from '../../../src/common/interfaces/responses';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const fileStorageService = new FileStorageService();
const rawFiledata = readFileSync(path.resolve(__dirname, '../../dummy-file.json'), 'utf-8');
const fileData = JSON.parse(rawFiledata);
const fileName = `${Date.now()}.jpeg`;
const fileContent = fileData.image;

describe('src/utils/path', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('storeLocalFile()', () => {
    let storeLocalFile: (fileName: string, base64File: string) => Promise<ResultResponse<string>>;
    let writeFileStub: sinon.SinonStub;
    let symlinkStub: sinon.SinonStub;

    beforeEach(() => {
      symlinkStub = sandbox.stub(fs, 'symlink');
      writeFileStub = sandbox.stub(fs, 'writeFile');
      storeLocalFile = fileStorageService['storeLocalFile'];
    });

    it('should write file to local disk with given file name', async () => {
      const regex = new RegExp(`storage/${fileName}`);

      writeFileStub.resolves();
      symlinkStub.resolves();

      const storageResponse = await storeLocalFile(fileName, fileContent);

      expect(storageResponse).to.have.deep.property('status').to.equal('success');
      expect(storageResponse).to.have.deep.property('data').to.match(regex);
      expect(writeFileStub).to.have.been.calledOnce;
      expect(symlinkStub).to.have.been.calledOnce;
    });

    it('should return error message on failure to store and symlink files', async () => {
      writeFileStub.rejects(new Error('SOME ERROR'));
      symlinkStub.resolves();

      const storageResponse = await storeLocalFile(fileName, fileContent);

      expect(storageResponse).to.have.deep.property('status').to.equal('error');
      expect(writeFileStub).to.have.been.calledOnce;
      expect(symlinkStub).to.not.have.been.called;
    });
  });

  context('deleteLocalFile()', () => {
    let deleteLocalFile: (fileName: string) => Promise<ResultResponse<string>>;
    let unlinkStub: sinon.SinonStub;

    beforeEach(() => {
      unlinkStub = sandbox.stub(fs, 'unlink');
      deleteLocalFile = fileStorageService['deleteLocalFile'];
    });

    it('should remove symlink and delete file with given file name', async () => {
      const regex = new RegExp(`storage/${fileName}`);

      unlinkStub.resolves();

      const deletionResponse = await deleteLocalFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('success');
      expect(deletionResponse).to.have.deep.property('data').to.match(regex);
      expect(unlinkStub).to.have.been.calledTwice;
    });

    it('should return error message if deletion fails', async () => {
      unlinkStub.rejects(new Error('SOME ERROR'));

      const deletionResponse = await deleteLocalFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('error');
      expect(unlinkStub).to.have.been.calledOnce;
    });
  });

  context('storeCloudFile()', () => {
    let storeCloudFile: (fileName: string, base64File: string, fileType: string) => Promise<ResultResponse<string>>;
    let s3ClientStub: sinon.SinonStub;

    beforeEach(() => {
      s3ClientStub = sandbox.stub(SThreeClient, 'saveToBucket');
      storeCloudFile = fileStorageService['storeCloudFile'];
    });

    it('should return object url to file on successful upload to aws s3', async () => {
      const regex = new RegExp(`${fileName}`);

      s3ClientStub.resolves({ status: 'success' });

      const storageResponse = await storeCloudFile(fileName, fileContent, 'image/jpeg');

      expect(storageResponse).to.have.deep.property('status').to.equal('success');
      expect(storageResponse)
        .to.have.deep.property('data')
        .to.match(/amazonaws.com/);
      expect(storageResponse).to.have.deep.property('data').to.match(regex);
      expect(s3ClientStub).to.have.been.calledOnce;
    });

    it('should return error message on unsuccessful upload to aws s3', async () => {
      s3ClientStub.rejects(new Error('SOME ERROR'));

      const storageResponse = await storeCloudFile(fileName, fileContent, 'image/jpeg');

      expect(storageResponse).to.have.deep.property('status').to.equal('error');
      expect(s3ClientStub).to.have.been.calledOnce;
    });
  });

  context('deleteCloudFile()', () => {
    let deleteCloudFile: (fileName: string) => Promise<ResultResponse<string>>;
    let s3ClientStub: sinon.SinonStub;

    beforeEach(() => {
      s3ClientStub = sandbox.stub(SThreeClient, 'deleteFromBucket');
      deleteCloudFile = fileStorageService['deleteCloudFile'];
    });

    it('should return object url to deleted file on aws s3', async () => {
      const regex = new RegExp(`${fileName}`);

      s3ClientStub.resolves({ status: 'success' });

      const deletionResponse = await deleteCloudFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('success');
      expect(deletionResponse)
        .to.have.deep.property('data')
        .to.match(/amazonaws.com/);
      expect(deletionResponse).to.have.deep.property('data').to.match(regex);
      expect(s3ClientStub).to.have.been.calledOnce;
    });

    it('should catch any error present during deletion of file from aws s3', async () => {
      s3ClientStub.rejects(new Error('SOME ERROR'));

      const deletionResponse = await deleteCloudFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('error');
      expect(s3ClientStub).to.have.been.calledOnce;
    });
  });

  context('storeFile()', () => {
    let symlinkStub: sinon.SinonStub;
    let s3ClientStub: sinon.SinonStub;
    let providerStub: sinon.SinonStub;
    let writeFileStub: sinon.SinonStub;

    beforeEach(() => {
      symlinkStub = sandbox.stub(fs, 'symlink');
      writeFileStub = sandbox.stub(fs, 'writeFile');
      providerStub = sandbox.stub(configs.filesystems, 'provider');
      s3ClientStub = sandbox.stub(SThreeClient, 'saveToBucket');
    });

    it('should store file to local storage disk if configured provider is "local"', async () => {
      providerStub.value('local');
      symlinkStub.resolves();
      writeFileStub.resolves();

      const storageResponse = await fileStorageService.storeFile(fileContent);

      expect(storageResponse).to.have.deep.property('status').to.equal('success');
      expect(writeFileStub).to.have.been.called;
      expect(symlinkStub).to.have.been.called;
    });

    it('should store file to cloud storage if configured provider is not "local"', async () => {
      providerStub.value('s3');
      s3ClientStub.resolves({ status: 'success' });

      const storageResponse = await fileStorageService.storeFile(fileContent);

      expect(storageResponse).to.have.deep.property('status').to.equal('success');
      expect(s3ClientStub).to.have.been.called;
    });

    it('should return error message on unsuccessful upload', async () => {
      providerStub.value('local');
      writeFileStub.rejects(new Error('SOME ERROR'));

      const storageResponse = await fileStorageService.storeFile(fileContent);

      expect(storageResponse).to.have.deep.property('status').to.equal('error');
      expect(storageResponse).to.have.deep.property('message').to.be.a('string');
      expect(writeFileStub).to.have.been.called;
    });
  });

  context('deleteFile()', () => {
    let unlinkStub: sinon.SinonStub;
    let s3ClientStub: sinon.SinonStub;
    let providerStub: sinon.SinonStub;

    beforeEach(() => {
      unlinkStub = sandbox.stub(fs, 'unlink');
      providerStub = sandbox.stub(configs.filesystems, 'provider');
      s3ClientStub = sandbox.stub(SThreeClient, 'deleteFromBucket');
    });

    it('should delete file from local storage disk if configured provider is "local"', async () => {
      providerStub.value('local');
      unlinkStub.resolves();

      const deletionResponse = await fileStorageService.deleteFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('success');
      expect(unlinkStub).to.have.been.called;
    });

    it('should delete file from cloud storage if configured provider is not "local"', async () => {
      providerStub.value('s3');
      s3ClientStub.resolves({ status: 'success' });

      const deletionResponse = await fileStorageService.deleteFile(fileName);

      expect(deletionResponse).to.have.deep.property('status').to.equal('success');
      expect(s3ClientStub).to.have.been.called;
    });
  });
});
