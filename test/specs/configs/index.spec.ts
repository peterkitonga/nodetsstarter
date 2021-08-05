import fs from 'fs';
import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import rewire from 'rewire';
import sinonChai from 'sinon-chai';

import configs from '../../../src/configs';

const { expect } = chai;

chai.use(sinonChai);

const sandbox = sinon.createSandbox();
const rewiredConfigs = rewire('../../../src/configs/index.ts');

describe('src/configs/index', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('.env file check', () => {
    it('should throw an error if .env file is not found', () => {
      const envCheck: () => void = rewiredConfigs.__get__('envCheck');

      sandbox.stub(path, 'join').returns('some wrong path');
      const fsAccessStub = sandbox.stub(fs, 'accessSync').throws();

      try {
        envCheck();
      } catch (err) {
        expect(err).to.exist;
        expect(err.message).to.equal('Could not find .env file');
        expect(fsAccessStub).to.have.been.calledOnceWith('some wrong path');
      }
    });
  });
});
