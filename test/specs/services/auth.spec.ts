import chai from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import User from '../../../src/models/user';
import AuthService from '../../../src/services/auth';
import PasswordReset from '../../../src/models/password-reset';
import NotFoundError from '../../../src/common/errors/not-found';
import ForbiddenError from '../../../src/common/errors/forbidden';
import UnauthorizedError from '../../../src/common/errors/unauthorized';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const authService = new AuthService();
const userDetails = {
  name: 'John Doe',
  email: 'disdegnosi@dunsoi.com', // generated from https://emailfake.com/
  password: 'supersecretpassword',
};
const userCredentials = {
  email: userDetails.email,
  password: userDetails.password,
};

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
      userExistsStub.resolves(true);
      const registrationResponse = authService.registerUser(userDetails);

      await expect(registrationResponse).to.eventually.be.rejectedWith(ForbiddenError);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
    });

    it('should not save user if password is not successfully hashed', async () => {
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
      userFindOneStub.resolves();
      const authenticationResponse = authService.authenticateUser(userCredentials);

      await expect(authenticationResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(userFindOneStub).to.have.been.calledOnceWith({ email: userCredentials.email });
    });

    it('should return error message if password does not match', async () => {
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

  context('activateUser()', () => {
    let userFindOneStub: sinon.SinonStub;
    let userExistsStub: sinon.SinonStub;
    const activationCode = 'eeHieSoo6Ziequ0opidieVau';

    beforeEach(() => {
      userFindOneStub = sandbox.stub(User, 'findOne');
      userExistsStub = sandbox.stub(User, 'exists');
    });

    it('should return error message if no user with given code is found', async () => {
      userExistsStub.resolves(false);

      const activationResponse = authService.activateUser(activationCode);

      await expect(activationResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(userExistsStub).to.have.been.calledOnceWith({ salt: activationCode });
    });

    it('should return error message if user is found but activated', async () => {
      userExistsStub.resolves(true);
      userFindOneStub.resolves({
        is_activated: true,
      });

      const activationResponse = authService.activateUser(activationCode);

      await expect(activationResponse).to.eventually.be.rejectedWith(ForbiddenError);
      expect(userExistsStub).to.have.been.calledOnceWith({ salt: activationCode });
    });

    it('should return user email and status on successful activation', async () => {
      const userSaveStub = sandbox.stub().resolves({
        name: userDetails.name,
        email: userDetails.email,
        is_activated: true,
      });
      userExistsStub.resolves(true);
      userFindOneStub.resolves({
        is_activated: false,
        save: userSaveStub,
      });

      const activationResponse = await authService.activateUser(activationCode);

      expect(userSaveStub).to.have.been.calledOnce;
      expect(activationResponse).to.have.nested.property('data.is_activated').to.equal(true);
      expect(activationResponse).to.have.nested.property('data.email').to.equal(userDetails.email);
    });
  });

  context('createResetToken()', () => {
    let userExistsStub: sinon.SinonStub;

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
    });

    it('should return error message if no user with given email is found', async () => {
      userExistsStub.resolves(false);

      const resetResponse = authService.createResetToken(userDetails.email);

      await expect(resetResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
    });

    it('should return email and token after successfully creating a reset request', async () => {
      userExistsStub.resolves(true);
      const resetToken = 'agai8ais4ufeiXeighaih9eibaSah6niweiqueighu0ieVaiquahceithaiph4oo';
      const passworResetSaveStub = sandbox.stub(PasswordReset.prototype, 'save').resolves({
        email: userDetails.email,
        token: resetToken,
      });

      const resetResponse = await authService.createResetToken(userDetails.email);

      expect(resetResponse).to.have.nested.property('data.token').to.equal(resetToken);
      expect(resetResponse).to.have.nested.property('data.email').to.equal(userDetails.email);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
      expect(passworResetSaveStub).to.have.been.calledOnceWith();
    });
  });

  context('resetPassword()', () => {
    let userExistsStub: sinon.SinonStub;
    let userFindOneStub: sinon.SinonStub;
    let passwordResetExistsStub: sinon.SinonStub;
    const resetToken = 'agai8ais4ufeiXeighaih9eibaSah6niweiqueighu0ieVaiquahceithaiph4oo';

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
      userFindOneStub = sandbox.stub(User, 'findOne');
      passwordResetExistsStub = sandbox.stub(PasswordReset, 'exists');
    });

    it('should return error message if no user with given email is found', async () => {
      userExistsStub.resolves(false);

      const passwordResetResponse = authService.resetPassword({
        token: resetToken,
        email: userDetails.email,
        password: userDetails.password,
      });

      await expect(passwordResetResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(userExistsStub).to.have.been.calledOnceWith({ email: userDetails.email });
    });

    it('should return error message if reset token is not found', async () => {
      userExistsStub.resolves(true);
      passwordResetExistsStub.resolves(false);

      const passwordResetResponse = authService.resetPassword({
        token: resetToken,
        email: userDetails.email,
        password: userDetails.password,
      });

      await expect(passwordResetResponse).to.eventually.be.rejectedWith(NotFoundError);
      expect(passwordResetExistsStub).to.have.been.calledOnce;
    });

    it('should not store the new password if hashing is unsucccessful', async () => {
      userExistsStub.resolves(true);
      passwordResetExistsStub.resolves(true);
      const bcryptHashStub = sandbox.stub(bcrypt, 'hash').rejects(new Error('HASH ERROR'));

      const passwordResetResponse = authService.resetPassword({
        token: resetToken,
        email: userDetails.email,
        password: userDetails.password,
      });

      await expect(passwordResetResponse).to.eventually.be.rejectedWith(Error);
      expect(bcryptHashStub).to.have.been.calledOnce;
    });

    it('should hash, store the new password and delete reset token', async () => {
      userExistsStub.resolves(true);
      passwordResetExistsStub.resolves(true);
      sandbox.stub(bcrypt, 'hash').resolves('hashedpassword');
      const passwordResetDeleteStub = sandbox.stub(PasswordReset, 'deleteOne').resolves();
      const userPasswordSaveStub = sandbox.stub().resolves({
        password: 'hashedpassword',
        salt: 'SOME SALT STRING',
      });
      userFindOneStub.resolves({
        password: 'hashedpassword',
        salt: 'SOME SALT STRING',
        save: userPasswordSaveStub,
      });

      const passwordResetResponse = authService.resetPassword({
        token: resetToken,
        email: userDetails.email,
        password: userDetails.password,
      });

      await expect(passwordResetResponse)
        .to.eventually.be.fulfilled.with.nested.property('data.email')
        .to.equal(userDetails.email);
      expect(passwordResetExistsStub).to.have.been.calledOnce;
      expect(userPasswordSaveStub).to.have.been.calledOnce;
      expect(passwordResetDeleteStub).to.have.been.calledOnce;
    });
  });
});
