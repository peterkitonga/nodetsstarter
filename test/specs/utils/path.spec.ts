import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { publicPath, storagePath, viewPath } from '../../../src/utils/path';

const { expect } = chai;

chai.use(sinonChai);

const fileName = 'example.txt';
const sandbox = sinon.createSandbox();

describe('src/utils/path', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('publicPath()', () => {
    it('should return path to public folder', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      publicPath();

      const lastArgument = pathJoinStub.getCall(0).args[1];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.match(/public/);
    });

    it('should return path to file if filename is provided', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      publicPath(fileName);

      const lastArgument = pathJoinStub.getCall(0).args[2];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.be.equal(fileName);
    });

    it('should return path to file in public folder as a string', () => {
      const regex = new RegExp(`public/${fileName}`);
      const pathToFile = publicPath(fileName);

      expect(pathToFile).to.be.a('string');
      expect(pathToFile).to.match(regex);
    });
  });

  context('storagePath()', () => {
    it('should return path to storage folder', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      storagePath();

      const lastArgument = pathJoinStub.getCall(0).args[1];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.match(/storage/);
    });

    it('should return path to file if filename is provided', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      storagePath(fileName);

      const lastArgument = pathJoinStub.getCall(0).args[2];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.be.equal(fileName);
    });

    it('should return path to file in storage folder as a string', () => {
      const regex = new RegExp(`storage/${fileName}`);
      const pathToFile = storagePath(fileName);

      expect(pathToFile).to.be.a('string');
      expect(pathToFile).to.match(regex);
    });
  });

  context('viewPath()', () => {
    it('should return path to views folder', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      viewPath();

      const lastArgument = pathJoinStub.getCall(0).args[1];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.match(/views/);
    });

    it('should return path to file if filename is provided', () => {
      const pathJoinStub = sandbox.stub(path, 'join');

      viewPath(fileName);

      const lastArgument = pathJoinStub.getCall(0).args[2];

      expect(pathJoinStub).to.have.been.called;
      expect(lastArgument).to.be.equal(fileName);
    });

    it('should return path to file in views folder as a string', () => {
      const regex = new RegExp(`views/${fileName}`);
      const pathToFile = viewPath(fileName);

      expect(pathToFile).to.be.a('string');
      expect(pathToFile).to.match(regex);
    });
  });
});
