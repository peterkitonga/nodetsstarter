import { Container } from 'typedi';
import request from 'supertest';
import configs from '@src/configs';
import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import AuthService from '@src/services/auth';
import MailerService from '@src/services/mailer';
import { HttpStatusCodes } from '@src/shared/enums';
import MongooseConnect from '@src/core/mongoose';
import ForbiddenError from '@src/shared/errors/forbidden';

describe('src/api/routes/auth', () => {
  configs.app.api.version = 'v2';
  configs.filesystems.limit = '10mb';

  Container.set(WinstonLogger, {
    info: jest.fn(),
    error: jest.fn(),
  });
  Container.set(MongooseConnect, {
    connect: jest.fn().mockResolvedValueOnce({
      message: 'SUCCESS',
    }),
  });

  const userName = 'John Doe';
  const userEmail = 'john.doe@test.com';
  const userPassword = 'SUPER_SECRET_PASSWORD';
  const salt = 'kai2gie6Hie7ux7aiGoo4utoh3aegot0phai0Tiavohlei7P';
  const resetToken = 'agai8ais4ufeiXeighaih9eibaSah6niweiqueighu0ieVaiquahceithaiph4oo';
  const jwtToken = 'jau4oV3edeenodees0ohquaighoghei0eeNgae8xeiki0tu8jaeY9qua0heem1EishiP9chee4thoo2dieNguuneeroo6cha';
  const ExpressAppInstance = Container.get(ExpressApp);

  ExpressAppInstance.setupBodyParser();
  ExpressAppInstance.setupCookieParser();
  ExpressAppInstance.handleAppRoutes();
  ExpressAppInstance.handleErrorMiddleware();

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('POST /{API PREFIX}/auth/register', () => {
    describe('success', () => {
      it('should register user and send welcome email with activation link', async () => {
        const mockAuthRegisterUser = jest.fn().mockResolvedValueOnce({
          data: {
            salt,
          },
        });
        const mockSendWelcomeEmail = jest.fn().mockResolvedValueOnce({
          message: 'MAIL_SENT',
        });

        Container.set(AuthService, {
          registerUser: mockAuthRegisterUser,
        });
        Container.set(MailerService, {
          sendWelcomeEmail: mockSendWelcomeEmail,
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({
          name: userName,
          email: userEmail,
          password: userPassword,
          passwordConfirmation: userPassword,
        });

        expect(mockAuthRegisterUser).toHaveBeenCalled();
        expect(mockSendWelcomeEmail).toHaveBeenCalled();
        expect(res.status).toEqual(HttpStatusCodes.CREATED);
        expect(res.body.message).toContain(`Please check your email '${userEmail}' for the activation link`);
      });
    });

    describe('error', () => {
      it('should return validation error messages if required fields are missing', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({});

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "name" field is required');
        expect(res.body.data[1]).toHaveProperty('message', 'The "email" field is required');
        expect(res.body.data[2]).toHaveProperty('message', 'The "password" field is required');
        expect(res.body.data[3]).toHaveProperty('message', 'The "passwordConfirmation" field is required');
      });

      it('should return a validation error message if the email is not valid', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({
          name: userName,
          email: 'invalid',
          password: userPassword,
          passwordConfirmation: userPassword,
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "email" field should be a valid email');
      });

      it('should return a validation error message if the password is less than 6 characters', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({
          name: userName,
          email: userEmail,
          password: 'short',
          passwordConfirmation: userPassword,
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "password" field should have a minimum length of 6 characters');
      });

      it('should return a validation error message if the password confirmation is not the same as the password', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({
          name: userName,
          email: userEmail,
          password: userPassword,
          passwordConfirmation: 'mismatch',
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "passwordConfirmation" field should match the password field');
      });

      it('should return an error message if a user with the email already exists', async () => {
        Container.set(AuthService, {
          registerUser: jest.fn().mockRejectedValueOnce(new ForbiddenError(`User with email '${userEmail}' already exists.`)),
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/register').send({
          name: userName,
          email: userEmail,
          password: userPassword,
          passwordConfirmation: userPassword,
        });

        expect(res.status).toEqual(HttpStatusCodes.FORBIDDEN);
        expect(res.body.message).toContain(`User with email '${userEmail}' already exists.`);
      });
    });
  });
});
