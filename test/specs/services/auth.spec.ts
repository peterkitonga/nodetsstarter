import chai from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import User from '../../../src/models/user';
import AuthService from '../../../src/services/auth';
import NotFoundError from '../../../src/common/errors/not-found';
import ForbiddenError from '../../../src/common/errors/forbidden';
import UnauthorizedError from '../../../src/common/errors/unauthorized';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const authService = new AuthService();

describe('src/services/auth: class AuthService', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('registerUser()', () => {
    let userExistsStub: sinon.SinonStub;
    let userSaveStub: sinon.SinonStub;

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
      userSaveStub = sandbox.stub(User.prototype, 'save');
    });

    it('should return error message if user exists', async () => {
      const userDetails = {
        name: 'John Doe',
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userExistsStub.resolves(true);
      const registrationResponse = authService.registerUser(userDetails);

      await expect(registrationResponse).to.eventually.be.rejectedWith(ForbiddenError);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
    });

    it('should not save user if password is not successfully hashed', async () => {
      const userDetails = {
        name: 'John Doe',
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userExistsStub.resolves(false);
      const bcryptHashStub = sandbox.stub(bcrypt, 'hash').rejects();
      const registrationResponse = authService.registerUser(userDetails);

      await expect(registrationResponse).to.eventually.be.rejectedWith(Error);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
      expect(bcryptHashStub).to.have.been.called;
      expect(userSaveStub).to.not.have.been.called;
    });

    it('should return user details after successful save', async () => {
      const bcryptHashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedpassword');
      const userDetails = {
        name: 'John Doe',
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userExistsStub.resolves(false);
      userSaveStub.resolves({
        _id: {
          $oid: 'someobjectid',
        },
        name: userDetails.name,
        email: userDetails.password,
        password: 'hashedpassword',
      });
      const registrationResponse = authService.registerUser(userDetails);

      await expect(registrationResponse).to.eventually.be.fulfilled.with.deep.property('data');
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
      expect(bcryptHashStub).to.have.been.called;
      expect(userSaveStub).to.have.been.called;
    });
  });

  context('authenticateUser()', () => {
    let userFindOneStub: sinon.SinonStub;

    beforeEach(() => {
      userFindOneStub = sandbox.stub(User, 'findOne');
    });

    it('should return error message if user is not found', async () => {
      const userCredentials = {
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userFindOneStub.resolves();
      const authenticationResponse = authService.authenticateUser(userCredentials);

      await expect(authenticationResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(userFindOneStub).to.have.been.calledOnceWith({ email: userCredentials.email });
    });

    it('should return error message if password does not match', async () => {
      const userCredentials = {
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userFindOneStub.resolves({
        password: 'hashedpassword',
      });
      const bcryptCompareStub = sandbox.stub(bcrypt, 'compare').resolves(false);
      const authenticationResponse = authService.authenticateUser(userCredentials);

      await expect(authenticationResponse).to.eventually.be.rejectedWith(UnauthorizedError);
      expect(userFindOneStub).to.have.been.calledOnceWith({ email: userCredentials.email });
      expect(bcryptCompareStub).to.have.been.calledOnceWith(userCredentials.password, 'hashedpassword');
    });

    it('should return a token after successful authentication', async () => {
      const userCredentials = {
        email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
        password: 'supersecretpassword',
      };
      userFindOneStub.resolves({
        _id: {
          $oid: 'someobjectid',
        },
        name: 'John Doe',
        email: userCredentials.email,
        password: 'hashedpassword',
        avatar: 'SOME URL',
        is_activated: true,
        created_at: 'SOME DATE',
      });
      const bcryptCompareStub = sandbox.stub(bcrypt, 'compare').resolves(true);
      const authenticationResponse = authService.authenticateUser(userCredentials);

      await expect(authenticationResponse)
        .to.eventually.be.fulfilled.with.nested.property('data.token')
        .to.be.a('string');
      expect(userFindOneStub).to.have.been.calledOnceWith({ email: userCredentials.email });
      expect(bcryptCompareStub).to.have.been.calledOnceWith(userCredentials.password, 'hashedpassword');
    });
  });
});
