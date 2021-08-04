import chai from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import configs from '../../../../src/configs';
import User from '../../../../src/models/user';
import Mailer from '../../../../src/loaders/nodemailer';
import ExpressApp from '../../../../src/loaders/express';
import MailerService from '../../../../src/services/mailer';
import WinstonLogger from '../../../../src/loaders/winston';
import { HttpStatusCodes } from '../../../../src/common/enums/http';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const userName = 'John Doe';
const userEmail = 'disdegnosi@dunsoi.com'; // generated from https://emailfake.com/
const userPassword = 'supersecretpassword';

describe('src/api/controllers/auth', () => {
  let winstonLoggerErrorStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox.stub(configs.app.api, 'prefix').returns('/api/v2');
    winstonLoggerErrorStub = sandbox.stub(WinstonLogger, 'error');

    ExpressApp.setupBodyParser();
    ExpressApp.handleAppRoutes();
    ExpressApp.handleErrorMiddleware();
  });

  afterEach(() => {
    sandbox.restore();
    ExpressApp['app'] = express();
  });

  context('POST /{API PREFIX}/auth/register', () => {
    let userSaveStub: sinon.SinonStub;
    let userExistsStub: sinon.SinonStub;

    beforeEach(() => {
      userExistsStub = sandbox.stub(User, 'exists');
      userSaveStub = sandbox.stub(User.prototype, 'save');
    });

    it('should return validation error message if name field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ email: userEmail, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('The "name" field is required');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if email field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ name: userName, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('The "email" field is required');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password field is missing', async () => {
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/register')
        .send({ name: userName, email: userEmail });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('The "password" field is required');
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

    it('should register user and send welcome email with verification link', async () => {
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
      const regex = new RegExp(`Please check your email '${userEmail}' for the verification link`);
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
      expect(welcomeEmailStub).to.have.been.calledOnceWith('somesupersecretsalt');
    });
  });

  context('POST /{API PREFIX}/auth/login', () => {
    let userFindOneStub: sinon.SinonStub;
    let bcryptCompareStub: sinon.SinonStub;

    beforeEach(() => {
      userFindOneStub = sandbox.stub(User, 'findOne');
      bcryptCompareStub = sandbox.stub(bcrypt, 'compare');
    });

    it('should return validation error message if email field is missing', async () => {
      const res = await request(ExpressApp['app']).post('/api/v2/auth/login').send({ password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('The "email" field is required');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return validation error message if password field is missing', async () => {
      const res = await request(ExpressApp['app']).post('/api/v2/auth/login').send({ email: userEmail });

      expect(res.status).to.equal(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(res.body.message).to.equal('The "password" field is required');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if user is not found', async () => {
      userFindOneStub.resolves();

      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.NOT_FOUND);
      expect(res.body.message).to.match(/Unauthorised/);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return error message if password is incorrect', async () => {
      bcryptCompareStub.resolves(false);
      userFindOneStub.resolves({
        password: 'hashedpassword',
      });
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: 'somewrongpassword' });

      expect(res.status).to.equal(HttpStatusCodes.UNAUTHORIZED);
      expect(res.body.message).to.match(/Unauthorised/);
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should catch general errors during authentication', async () => {
      userFindOneStub.rejects(new Error('SOME GENERAL ERROR'));
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.INTERNAL_SERVER);
      expect(res.body.message).to.exist.and.be.a('string');
      expect(winstonLoggerErrorStub).to.have.been.called;
    });

    it('should return token on successful authentication', async () => {
      bcryptCompareStub.resolves(true);
      userFindOneStub.resolves({
        _id: {
          $oid: 'someobjectid',
        },
        name: userName,
        email: userEmail,
        password: 'hashedpassword',
        avatar: null,
        is_activated: true,
        created_at: 'SOME DATE',
      });
      const res = await request(ExpressApp['app'])
        .post('/api/v2/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(res.status).to.equal(HttpStatusCodes.OK);
      expect(res.body.data).to.have.deep.property('token');
    });
  });
});
