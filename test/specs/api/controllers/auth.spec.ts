import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { readFileSync } from 'fs';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import configs from '../../../../src/configs';
import User from '../../../../src/models/user';
import Salt from '../../../../src/models/salt';
import Mailer from '../../../../src/loaders/nodemailer';
import ExpressApp from '../../../../src/loaders/express';
import MailerService from '../../../../src/services/mailer';
import WinstonLogger from '../../../../src/loaders/winston';
import FileStorageService from '../../../../src/services/file';
import RefreshToken from '../../../../src/models/refresh-token';
import PasswordReset from '../../../../src/models/password-reset';
import { HttpStatusCodes } from '../../../../src/common/enums/http';
import NotFoundError from '../../../../src/common/errors/not-found';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const userName = 'John Doe';
const userEmail = 'disdegnosi@dunsoi.com'; // generated from https://emailfake.com/
const userPassword = 'supersecretpassword';
const salt = 'kai2gie6Hie7ux7aiGoo4utoh3aegot0phai0Tiavohlei7P';
const resetToken = 'agai8ais4ufeiXeighaih9eibaSah6niweiqueighu0ieVaiquahceithaiph4oo';
const jwtToken = 'jau4oV3edeenodees0ohquaighoghei0eeNgae8xeiki0tu8jaeY9qua0heem1EishiP9chee4thoo2dieNguuneeroo6cha';

describe('src/api/controllers/auth', () => {
  let winstonLoggerErrorStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox.stub(configs.filesystems, 'limit').value('10mb');
    sandbox.stub(configs.app.api, 'prefix').returns('/api/v2');
    winstonLoggerErrorStub = sandbox.stub(WinstonLogger, 'error');

    ExpressApp.setupBodyParser();
    ExpressApp.setupCookieParser();
    ExpressApp.handleAppRoutes();
    ExpressApp.handleErrorMiddleware();
  });

  afterEach(() => {
    sandbox.restore();
    ExpressApp['app'] = express();
  });

  context('POST /{API PREFIX}/auth/register', () => {
    let userSaveStub: sinon.SinonStub;
    let saltSaveStub: sinon.SinonStub;
    let userExistsStub: sinon.SinonStub;

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
      userSaveStub = sandbox.stub(User.prototype, 'save');
      saltSaveStub = sandbox.stub(Salt.prototype, 'save');
    });

    it('should return validation error message if name field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ email: userEmail, password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if email field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ name: userName, password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ name: userName, email: userEmail, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if user already exists', async () => {
      userExistsStub.resolves(true);
      const res = await request(ExpressApp['app']).post('/api/v2/auth/register').send({
        name: userName,
        email: userEmail,
        password: userPassword,
        password_confirmation: userPassword,
      });

      expect(res.status).to.equal(HttpStatusCodes.FORBIDDEN);
      expect(res.body.message).to.equal(`User with email '${userEmail}' already exists.`);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should catch general errors during registration', async () => {
      userExistsStub.rejects(new Error('SOME GENERAL ERROR'));
      const res = await request(ExpressApp['app']).post('/api/v2/auth/register').send({
        name: userName,
        email: userEmail,
        password: userPassword,
        password_confirmation: userPassword,
      });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should register user and send welcome email with activation link', async () => {
      sandbox.stub(Mailer['transporter'], 'sendMail').resolves({ response: 'EMAIL SENT' });
      userExistsStub.resolves(false);
      userSaveStub.resolves({
        _id: {
          $oid: 'someobjectid',
        },
        name: userName,
        email: userEmail,
        password: 'hashedpassword',
        salt: 'somesupersecretsalt',
      });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      const regex = new RegExp(`Please check your email '${userEmail}' for the activation link`);
      const bcryptHashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedpassword');
      const welcomeEmailStub = sandbox
        .stub(MailerService.prototype, 'sendWelcomeEmail')
        .resolves({ status: 'success', message: 'Sent email' });

      const res = await request(ExpressApp['app']).post('/api/v2/auth/register').send({
        name: userName,
        email: userEmail,
        password: userPassword,
        password_confirmation: userPassword,
      });

      expect(res.status).to.equal(HttpStatusCodes.CREATED);
      expect(res.body.message).to.match(regex);
      expect(bcryptHashStub).to.have.been.calledOnce;
      expect(userSaveStub).to.have.been.calledOnce;
      expect(saltSaveStub).to.have.been.calledOnce;
      expect(welcomeEmailStub).to.have.been.calledOnceWith('somesaltstring');
    });
  });

  context('POST /{API PREFIX}/auth/login', () => {
    let saltSaveStub: sinon.SinonStub;
    let userFindOneStub: sinon.SinonStub;
    let bcryptCompareStub: sinon.SinonStub;
    let refreshTokenSaveStub: sinon.SinonStub;

    beforeEach(() => {
      userFindOneStub = sandbox.stub(User, 'findOne');
      saltSaveStub = sandbox.stub(Salt.prototype, 'save');
      bcryptCompareStub = sandbox.stub(bcrypt, 'compare');
      refreshTokenSaveStub = sandbox.stub(RefreshToken.prototype, 'save');
    });

    it('should return validation error message if email field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if remember me field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if user is not found', async () => {
      userFindOneStub.resolves();

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.match(/does not exist./);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if user account is not activated', async () => {
      userFindOneStub.resolves({
        is_activated: false,
      });

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.FORBIDDEN);
      expect(res.body.message).to.match(/is not activated yet/);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if password is incorrect', async () => {
      bcryptCompareStub.resolves(false);
      userFindOneStub.resolves({
        password: 'hashedpassword',
        is_activated: true,
      });

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: 'somewrongpassword', remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.match(/Unauthorised/);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should catch general errors during authentication', async () => {
      userFindOneStub.rejects(new Error('SOME GENERAL ERROR'));

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error if refresh token is not generated', async () => {
      bcryptCompareStub.resolves(true);
      userFindOneStub.resolves({
        _id: 'someobjectid',
        password: 'hashedpassword',
        is_activated: true,
      });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      refreshTokenSaveStub.rejects(new Error('SOME ERROR'));

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
      expect(refreshTokenSaveStub).to.have.been.called;
      expect(saltSaveStub).to.have.been.called;
    });

    it('should generate refresh token with 30 day lifetime if remember me is enabled', async () => {
      bcryptCompareStub.resolves(true);
      userFindOneStub.resolves({
        _id: 'someobjectid',
        name: userName,
        email: userEmail,
        password: 'hashedpassword',
        avatar: null,
        is_activated: true,
        created_at: 'SOME DATE',
      });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      refreshTokenSaveStub.resolves({ _id: 'someobjectid' });

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: true });

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.headers['set-cookie']).to.exist.and.have.lengthOf(1);
      expect(res.body.data).to.have.deep.property('token');
      expect(refreshTokenSaveStub).to.have.been.calledOnce;
      expect(saltSaveStub).to.have.been.calledOnce;
    });

    it('should return token on successful authentication', async () => {
      bcryptCompareStub.resolves(true);
      userFindOneStub.resolves({
        _id: 'someobjectid',
        name: userName,
        email: userEmail,
        password: 'hashedpassword',
        avatar: null,
        is_activated: true,
        created_at: 'SOME DATE',
      });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      refreshTokenSaveStub.resolves({ _id: 'someobjectid' });

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword, remember_me: false });

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.headers['set-cookie']).to.exist.and.have.lengthOf(1);
      expect(res.body.data).to.have.deep.property('token');
      expect(refreshTokenSaveStub).to.have.been.calledOnce;
      expect(saltSaveStub).to.have.been.calledOnce;
    });
  });

  context('GET /{API PREFIX}/auth/activate/:code', () => {
    let saltDeleteStub: sinon.SinonStub;
    let saltFindOneStub: sinon.SinonStub;
    let userFindByIdStub: sinon.SinonStub;
    const activationCode = 'eeHieSoo6Ziequ0opidieVau';

    beforeEach(() => {
      saltFindOneStub = sandbox.stub(Salt, 'findOne');
      saltDeleteStub = sandbox.stub(Salt, 'deleteOne');
      userFindByIdStub = sandbox.stub(User, 'findById');
    });

    it('should return error message if given code is not found', async () => {
      saltFindOneStub.resolves();
      const regex = new RegExp(`'${activationCode}' does not exist.`);

      const res = await request(ExpressApp['app']).get(`/api/v2/auth/activate/${activationCode}`);

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.exist.and.match(regex);
      expect(winstonLoggerErrorStub).to.have.been.called;
      expect(saltFindOneStub).to.have.been.calledOnceWith({ salt: activationCode });
      expect(userFindByIdStub).to.have.not.been.called;
    });

    it('should return error message if user is already activated', async () => {
      saltFindOneStub.resolves({
        _id: 'someobjectid',
        salt: activationCode,
        user: 'someobjectid',
      });
      userFindByIdStub.resolves({
        is_activated: true,
      });
      const regex = new RegExp(`'${activationCode}' is already activated.`);

      const res = await request(ExpressApp['app']).get(`/api/v2/auth/activate/${activationCode}`);

      expect(res.status).to.equal(HttpStatusCodes.FORBIDDEN);
      expect(res.body.message).to.exist.and.match(regex);
      expect(saltFindOneStub).to.have.been.calledOnceWith({ salt: activationCode });
      expect(userFindByIdStub).to.have.been.calledOnce;
    });

    it('should catch general errors during activation', async () => {
      saltFindOneStub.resolves({
        _id: 'someobjectid',
        salt: activationCode,
        user: 'someobjectid',
      });
      userFindByIdStub.rejects(new Error('SOME GENERAL ERROR'));

      const res = await request(ExpressApp['app']).get(`/api/v2/auth/activate/${activationCode}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
      expect(saltFindOneStub).to.have.been.calledOnceWith({ salt: activationCode });
      expect(userFindByIdStub).to.have.been.calledOnce;
    });

    it('should return success message on successful activation', async () => {
      saltFindOneStub.resolves({
        _id: 'someobjectid',
        salt: activationCode,
        user: 'someobjectid',
      });
      const userSaveStub = sandbox.stub().resolves({
        name: userName,
        email: userEmail,
        is_activated: true,
      });
      userFindByIdStub.resolves({
        is_activated: false,
        save: userSaveStub,
      });
      saltDeleteStub.resolves({
        _id: 'someobjectid',
      });
      const regex = new RegExp(`'${userEmail}' successfully activated.`);

      const res = await request(ExpressApp['app']).get(`/api/v2/auth/activate/${activationCode}`);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.message).to.exist.and.match(regex);
      expect(saltFindOneStub).to.have.been.calledOnceWith({ salt: activationCode });
      expect(userFindByIdStub).to.have.been.calledOnce;
      expect(userSaveStub).to.have.been.calledOnce;
      expect(saltDeleteStub).to.have.been.calledOnce;
    });
  });

  context('POST /{API PREFIX}/auth/send/reset/link', () => {
    let userExistsStub: sinon.SinonStub;

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
    });

    it('should return validation error message if email field is missing', async () => {
      const res = await request(ExpressApp['app']).post('/api/v2/auth/send/reset/link').send({});

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if no user with given email is found', async () => {
      userExistsStub.resolves(false);
      const regex = new RegExp(`'${userEmail}' does not exist.`);

      const res = await request(ExpressApp['app']).post('/api/v2/auth/send/reset/link').send({ email: userEmail });

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.exist.and.match(regex);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should catch general errors while creating a reset token', async () => {
      userExistsStub.rejects(new Error('SOME GENERAL ERROR'));
      const res = await request(ExpressApp['app']).post('/api/v2/auth/send/reset/link').send({ email: userEmail });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should create reset token and send email with a reset password link', async () => {
      sandbox.stub(Mailer['transporter'], 'sendMail').resolves({ response: 'EMAIL SENT' });
      userExistsStub.resolves(true);
      const regex = new RegExp(`has been sent to '${userEmail}'.`);
      const passwordResetSaveStub = sandbox.stub(PasswordReset.prototype, 'save').resolves({
        email: userName,
        token: resetToken,
      });
      const resetEmailStub = sandbox
        .stub(MailerService.prototype, 'sendResetPasswordEmail')
        .resolves({ status: 'success', message: 'Sent email' });

      const res = await request(ExpressApp['app']).post('/api/v2/auth/send/reset/link').send({ email: userEmail });

      expect(res.status).to.equal(HttpStatusCodes.CREATED);
      expect(res.body.message).to.exist.and.match(regex);
      expect(passwordResetSaveStub).to.have.been.calledOnce;
      expect(resetEmailStub).to.have.been.calledOnceWith(resetToken);
    });
  });

  context('POST /{API PREFIX}/auth/reset/password', () => {
    let saltDeleteStub: sinon.SinonStub;
    let userFindOneStub: sinon.SinonStub;
    let passwordResetFindStub: sinon.SinonStub;
    let refreshTokenDeleteStub: sinon.SinonStub;
    let passwordResetDeleteStub: sinon.SinonStub;

    beforeEach(() => {
      userFindOneStub = sandbox.stub(User, 'findOne');
      saltDeleteStub = sandbox.stub(Salt, 'deleteMany');
      passwordResetFindStub = sandbox.stub(PasswordReset, 'findOne');
      refreshTokenDeleteStub = sandbox.stub(RefreshToken, 'deleteMany');
      passwordResetDeleteStub = sandbox.stub(PasswordReset, 'deleteOne');
    });

    it('should return validation error message if token field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ token: resetToken, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password confirmation field does not match the password', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ token: resetToken, password: userPassword, password_confirmation: 'otherpassword' });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if reset token is not found', async () => {
      passwordResetFindStub.resolves();
      const regex = new RegExp(`'${resetToken}' does not exist.`);

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ token: resetToken, password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.exist.and.match(regex);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should catch general errors while reseting passwords', async () => {
      passwordResetFindStub.rejects(new Error('SOME GENERAL ERROR'));

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ token: resetToken, password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should update password, delete salts and refresh tokens', async () => {
      const regex = new RegExp(`'${userEmail}' has been reset successfully.`);
      passwordResetFindStub.resolves({ token: resetToken, email: userEmail });
      sandbox.stub(bcrypt, 'hash').resolves('hashedpassword');
      const userPasswordSaveStub = sandbox.stub().resolves({
        password: 'hashedpassword',
        salt: 'SOME SALT STRING',
      });
      userFindOneStub.resolves({
        password: 'hashedpassword',
        salt: 'SOME SALT STRING',
        save: userPasswordSaveStub,
      });
      passwordResetDeleteStub.resolves();
      refreshTokenDeleteStub.resolves();
      saltDeleteStub.resolves();

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/reset/password')
        .send({ token: resetToken, password: userPassword, password_confirmation: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.message).to.exist.and.match(regex);
      expect(passwordResetFindStub).to.have.been.calledOnce;
      expect(userPasswordSaveStub).to.have.been.calledOnce;
      expect(passwordResetDeleteStub).to.have.been.calledOnce;
      expect(refreshTokenDeleteStub).to.have.been.calledOnce;
      expect(saltDeleteStub).to.have.been.calledOnce;
    });
  });

  context('GET /{API PREFIX}/auth/refresh/token', () => {
    let saltSaveStub: sinon.SinonStub;
    let jwtVerifyStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;
    let saltDeleteStub: sinon.SinonStub;
    let userFindByIdStub: sinon.SinonStub;
    let refreshTokenSaveStub: sinon.SinonStub;
    let refreshTokenDeleteStub: sinon.SinonStub;

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      saltDeleteStub = sandbox.stub(Salt, 'deleteOne');
      userFindByIdStub = sandbox.stub(User, 'findById');
      saltSaveStub = sandbox.stub(Salt.prototype, 'save');
      refreshTokenSaveStub = sandbox.stub(RefreshToken.prototype, 'save');
      refreshTokenDeleteStub = sandbox.stub(RefreshToken, 'findByIdAndDelete');
    });

    it('should return error if refresh token cookie is missing', async () => {
      const res = await request(ExpressApp['app']).get('/api/v2/auth/refresh/token');

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.to.equal('Authentication failed. Please login.');
    });

    it('should return error if refresh token is not decoded', async () => {
      jwtVerifyStub.returns(undefined);

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/refresh/token')
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.to.equal('Authentication failed. Please login.');
      expect(jwtVerifyStub).to.have.been.calledOnceWith(jwtToken);
    });

    it('should return error if refresh token is expired', async () => {
      jwtVerifyStub.throws(new TokenExpiredError('jwt expired', new Date()));

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/refresh/token')
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.to.equal('Unauthorized. Refresh token is expired.');
      expect(jwtVerifyStub).to.have.been.calledOnceWith(jwtToken);
    });

    it('should return error if refresh token is no longer valid', async () => {
      jwtVerifyStub.returns({ token: 'thie7hie6gaev5Oothaethe2', duration: 24, salt });
      saltExistsStub.resolves(false);

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/refresh/token')
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.to.equal('Authentication failed. Please login.');
      expect(jwtVerifyStub).to.have.been.calledOnceWith(jwtToken);
    });

    it('should return error if generation of token is unsuccessful', async () => {
      jwtVerifyStub.returns({ token: 'thie7hie6gaev5Oothaethe2', duration: 24, salt });
      saltExistsStub.resolves(true);
      refreshTokenDeleteStub.resolves({ user: 'someuserobjectid' });
      refreshTokenSaveStub.resolves({ _id: 'someobjectid' });
      saltDeleteStub.resolves({ _id: 'someobjectid' });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      userFindByIdStub.resolves({
        _id: 'someobjectid',
        email: userEmail,
        salt: 'SOME SALT STRING',
      });
      const jwtSignStub = sandbox.stub(jwt, 'sign').throws(new Error('SOME ERROR'));

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/refresh/token')
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(jwtSignStub).to.have.been.calledOnce;
    });

    it('should return new token and add refresh token cookie', async () => {
      jwtVerifyStub.returns({ token: 'thie7hie6gaev5Oothaethe2', duration: 720, salt });
      saltExistsStub.resolves(true);
      refreshTokenDeleteStub.resolves({ user: 'someuserobjectid' });
      refreshTokenSaveStub.resolves({ _id: 'someobjectid' });
      saltDeleteStub.resolves({ _id: 'someobjectid' });
      saltSaveStub.resolves({
        _id: 'someobjectid',
        salt: 'somesaltstring',
        user: 'someobjectid',
      });
      userFindByIdStub.resolves({
        _id: 'someobjectid',
        email: userEmail,
        salt: 'SOME SALT STRING',
      });

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/refresh/token')
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.CREATED);
      expect(res.body.data).to.have.deep.property('token');
      expect(res.headers['set-cookie']).to.exist.and.have.lengthOf(1);
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(userFindByIdStub).to.have.been.calledOnce;
      expect(refreshTokenDeleteStub).to.have.been.calledOnce;
      expect(refreshTokenSaveStub).to.have.been.calledOnce;
    });
  });

  context('GET /{API PREFIX}/auth/user', () => {
    let userFindStub: sinon.SinonStub;
    let jwtVerifyStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      userFindStub = sandbox.stub(User, 'findById');
    });

    it('should catch errors if fetching user data fails', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.rejects(new Error('SOME ERROR'));

      const res = await request(ExpressApp['app']).get('/api/v2/auth/user').set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(userFindStub).to.have.been.calledOnce;
    });

    it('should return user with given id', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        name: userName,
        email: userEmail,
        avatar: 'SOME URL',
        is_activated: true,
        created_at: new Date().toISOString(),
      });

      const res = await request(ExpressApp['app']).get('/api/v2/auth/user').set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.data).to.exist.and.have.deep.property('email');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(userFindStub).to.have.been.calledOnce;
    });
  });

  context('PUT /{API PREFIX}/auth/update/user', () => {
    let userFindStub: sinon.SinonStub;
    let jwtVerifyStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      userFindStub = sandbox.stub(User, 'findById');
    });

    it('should return validation error message if name field is missing', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/user')
        .send({ email: userEmail })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if email field is missing', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/user')
        .send({ name: userName })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if updating user fails', async () => {
      const updateUserSaveStub = sandbox.stub().rejects(new Error('SOME ERROR'));
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        name: userName,
        email: userEmail,
        save: updateUserSaveStub,
      });

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/user')
        .send({ name: userName, email: userEmail })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return user details after a successful update', async () => {
      const updateUserSaveStub = sandbox.stub().resolves({
        name: userName,
        email: userEmail,
        avatar: `https://example.com/path/${Date.now()}.jpeg`,
        is_activated: true,
        created_at: new Date().toISOString,
      });
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        name: userName,
        email: userEmail,
        save: updateUserSaveStub,
      });

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/user')
        .send({ name: userName, email: userEmail })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.data).to.have.deep.property('name');
      expect(res.body.data).to.have.deep.property('email');
      expect(userFindStub).to.have.been.calledOnce;
      expect(updateUserSaveStub).to.have.been.calledOnce;
    });
  });

  context('PUT /{API PREFIX}/auth/update/avatar', () => {
    let userFindStub: sinon.SinonStub;
    let jwtVerifyStub: sinon.SinonStub;
    let storeFileStub: sinon.SinonStub;
    let deleteFileStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;
    const avatarUrl = `https://example.com/path/${Date.now()}.jpeg`;
    const rawFiledata = readFileSync(path.resolve(__dirname, '../../../dummy-file.json'), 'utf-8');
    const fileData = JSON.parse(rawFiledata);

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      userFindStub = sandbox.stub(User, 'findById');
      storeFileStub = sandbox.stub(FileStorageService.prototype, 'storeFile');
      deleteFileStub = sandbox.stub(FileStorageService.prototype, 'deleteFile');
    });

    it('should return validation error message if file field is missing', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if file is not a valid data uri', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .send({ file: 'someinvaliddatauri' })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if file has an unsupported mime type', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const unsupportedFile = fileData.invalid_image;
      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .send({ file: unsupportedFile })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if upload fails', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        name: userName,
        email: userEmail,
      });
      storeFileStub.rejects(new NotFoundError('FILE STORAGE NOT FOUND'));

      const validFile = fileData.image;
      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .send({ file: validFile })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(deleteFileStub).to.have.not.been.called;
      expect(userFindStub).to.have.been.calledOnce;
    });

    it('should catch general errors if update fails', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        name: userName,
        email: userEmail,
      });
      storeFileStub.rejects(new Error('SOME ERROR'));

      const validFile = fileData.image;
      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .send({ file: validFile })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(deleteFileStub).to.have.not.been.called;
      expect(userFindStub).to.have.been.calledOnce;
    });

    it('should delete old avatar, store new avatar and return url', async () => {
      const updateAvatarSaveStub = sandbox.stub().resolves({
        avatar: avatarUrl,
      });
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      userFindStub.resolves({
        avatar: avatarUrl,
        save: updateAvatarSaveStub,
      });
      deleteFileStub.resolves({ data: avatarUrl });
      storeFileStub.resolves({ data: avatarUrl });

      const validFile = fileData.image;
      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/avatar')
        .send({ file: validFile })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.data).to.have.deep.property('avatar');
      expect(deleteFileStub).to.have.been.calledOnceWith(avatarUrl);
      expect(userFindStub).to.have.been.calledTwice;
    });
  });

  context('PUT /{API PREFIX}/auth/update/password', () => {
    let userFindStub: sinon.SinonStub;
    let jwtVerifyStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;
    let bcryptHashStub: sinon.SinonStub;

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      userFindStub = sandbox.stub(User, 'findById');
      bcryptHashStub = sandbox.stub(bcrypt, 'hash');
    });

    it('should return validation error message if password field is missing', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/password')
        .send({ password_confirmation: userPassword })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password confirmation field does not match the password', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/password')
        .send({ password: userPassword, password_confirmation: 'otherpassword' })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('There are validation errors for your inputs');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if updating password is unsuccessful', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      const userPasswordSaveStub = sandbox.stub().rejects(new Error('SOME ERROR'));
      userFindStub.resolves({
        password: 'oldhashedpassword',
        save: userPasswordSaveStub,
      });

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/password')
        .send({ password: userPassword, password_confirmation: userPassword })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(userFindStub).to.have.been.calledOnce;
      expect(userPasswordSaveStub).to.have.been.calledOnce;
    });

    it('should return successful message after updating password', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      bcryptHashStub.resolves('hashedpassword');
      const userPasswordSaveStub = sandbox.stub().resolves({
        password: 'hashedpassword',
      });
      userFindStub.resolves({
        password: 'oldhashedpassword',
        save: userPasswordSaveStub,
      });

      const res = await request(ExpressApp['app'])
        .put('/api/v2/auth/update/password')
        .send({ password: userPassword, password_confirmation: userPassword })
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.message).to.exist.and.have.equal('Successfully updated password.');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(userFindStub).to.have.been.calledOnce;
      expect(bcryptHashStub).to.have.been.calledOnce;
      expect(userPasswordSaveStub).to.have.been.calledOnce;
    });
  });

  context('GET /{API PREFIX}/auth/logout', () => {
    let jwtVerifyStub: sinon.SinonStub;
    let jwtDecodeStub: sinon.SinonStub;
    let saltExistsStub: sinon.SinonStub;
    let saltDeleteStub: sinon.SinonStub;
    let refreshTokenDeleteStub: sinon.SinonStub;

    beforeEach(() => {
      jwtVerifyStub = sandbox.stub(jwt, 'verify');
      jwtDecodeStub = sandbox.stub(jwt, 'decode');
      saltExistsStub = sandbox.stub(Salt, 'exists');
      saltDeleteStub = sandbox.stub(Salt, 'deleteOne');
      refreshTokenDeleteStub = sandbox.stub(RefreshToken, 'deleteOne');
    });

    it('should return error if bearer token is missing', async () => {
      const res = await request(ExpressApp['app']).get('/api/v2/auth/logout');

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.match(/Bearer token is required/);
      expect(jwtVerifyStub).to.have.not.been.called;
      expect(saltExistsStub).to.have.not.been.called;
    });

    it('should return error if bearer token is not decoded', async () => {
      jwtVerifyStub.returns(undefined);

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.match(/Authentication failed/);
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.not.been.called;
    });

    it('should return error if bearer token has expired', async () => {
      jwtVerifyStub.throws(new TokenExpiredError('jwt expired', new Date()));

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.match(/Bearer token is expired/);
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.not.been.called;
    });

    it('should catch errors if bearer token verification fails', async () => {
      jwtVerifyStub.throws(new Error('JWT ERROR'));

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.equal('JWT ERROR');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.not.been.called;
    });

    it('should return error if bearer token is no longer valid', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(false);

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.exist.and.match(/Authentication failed/);
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
    });

    it('should return error if refresh token is missing', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).to.equal(HttpStatusCodes.FORBIDDEN);
      expect(res.body.message).to.exist.and.match(/Refresh token missing/);
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
    });

    it('should catch errors if deletion of refresh token fails', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      jwtDecodeStub.returns({
        token: jwtToken,
      });
      saltDeleteStub.resolves({
        _id: 'someobjectid',
      });
      refreshTokenDeleteStub.rejects(new Error('SOME ERROR'));

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`)
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(jwtDecodeStub).to.have.been.calledOnce;
      expect(saltDeleteStub).to.have.been.calledOnce;
      expect(refreshTokenDeleteStub).to.have.been.calledOnce;
    });

    it('should clear all cookies, remove refresh token and salt', async () => {
      jwtVerifyStub.returns({
        auth: 'someobjectid',
        email: userEmail,
        salt: 'SOME SALT STRING',
      });
      saltExistsStub.resolves(true);
      jwtDecodeStub.returns({
        token: jwtToken,
      });
      saltDeleteStub.resolves({
        _id: 'someobjectid',
      });
      refreshTokenDeleteStub.resolves({ _id: 'someobjectid' });

      const res = await request(ExpressApp['app'])
        .get('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`)
        .set('Cookie', [`refresh_token=${jwtToken}`]);

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.message).to.exist.and.equal('Successfully logged out.');
      expect(jwtVerifyStub).to.have.been.calledOnce;
      expect(saltExistsStub).to.have.been.calledOnce;
      expect(jwtDecodeStub).to.have.been.calledOnce;
      expect(saltDeleteStub).to.have.been.calledOnce;
      expect(refreshTokenDeleteStub).to.have.been.calledOnce;
    });
  });
});
