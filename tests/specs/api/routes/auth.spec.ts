import request from 'supertest';
import { Container } from 'typedi';
import { Cookie, CookieAccessInfo } from 'cookiejar';

import configs from '@src/configs';
import ExpressApp from '@src/core/express';
import AuthService from '@src/services/auth';
import MailerService from '@src/services/mailer';
import { HttpStatusCodes } from '@src/shared/enums';
import ForbiddenError from '@src/shared/errors/forbidden';
import NotFoundError from '@src/shared/errors/not-found';
import MongooseConnect from '@src/core/mongoose';
import WinstonLogger from '@src/core/winston';

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

  const dateToday = new Date();
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

  describe('POST /{API PREFIX}/auth/login', () => {
    describe('success', () => {
      it('should set a cookie for the refresh token when authenticating a user', async () => {
        const mockAuthenticateUser = jest.fn().mockResolvedValueOnce({
          data: {
            token: jwtToken,
            refreshToken: jwtToken,
            lifetime: '3600',
            auth: {
              name: userName,
              email: userEmail,
              isActivated: true,
              avatar: 'https://fakeimg.pl/400x400/282828/eae0d0/?retina=1&text=%3C%3Apepw%3A989410572514758676%3E',
              createdAt: dateToday.toISOString(),
            },
          },
        });

        Container.set(AuthService, {
          authenticateUser: mockAuthenticateUser,
        });

        const agent = request.agent(ExpressAppInstance['app']);
        const res = await agent.post('/api/v2/auth/login').send({
          email: userEmail,
          password: userPassword,
          rememberMe: true,
        });

        expect(mockAuthenticateUser).toHaveBeenCalled();
        expect(res.headers['set-cookie'][0]).toContain('refreshToken');
        expect(res.status).toEqual(HttpStatusCodes.OK);
      });

      it('should generate refresh token with 30 day lifetime if remember me is true', async () => {
        const dateToday = new Date();

        Container.set(AuthService, {
          authenticateUser: jest.fn().mockResolvedValueOnce({
            data: {
              token: jwtToken,
              refreshToken: jwtToken,
              lifetime: '3600',
              auth: {
                name: userName,
                email: userEmail,
                isActivated: true,
                avatar: 'https://fakeimg.pl/400x400/282828/eae0d0/?retina=1&text=%3C%3Apepw%3A989410572514758676%3E',
                createdAt: dateToday.toISOString(),
              },
            },
          }),
        });

        const agent = request.agent(ExpressAppInstance['app']);
        await agent.post('/api/v2/auth/login').send({
          email: userEmail,
          password: userPassword,
          rememberMe: true,
        });
        const refreshTokenCookie = agent.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;

        // One day in milliseconds
        const oneDay = 1000 * 60 * 60 * 24;

        // Calculate the time difference in milliseconds
        const timeDiff = Math.abs(new Date(refreshTokenCookie.expiration_date).getTime() - dateToday.getTime());

        // Convert milliseconds to days
        const daysDiff = Math.round(timeDiff / oneDay);

        expect(daysDiff).toEqual(30);
      });

      it('should generate refresh token with 1 day lifetime if remember me is false', async () => {
        Container.set(AuthService, {
          authenticateUser: jest.fn().mockResolvedValueOnce({
            data: {
              token: jwtToken,
              refreshToken: jwtToken,
              lifetime: '3600',
              auth: {
                name: userName,
                email: userEmail,
                isActivated: true,
                avatar: 'https://fakeimg.pl/400x400/282828/eae0d0/?retina=1&text=%3C%3Apepw%3A989410572514758676%3E',
                createdAt: dateToday.toISOString(),
              },
            },
          }),
        });

        const agent = request.agent(ExpressAppInstance['app']);
        await agent.post('/api/v2/auth/login').send({
          email: userEmail,
          password: userPassword,
          rememberMe: false,
        });
        const refreshTokenCookie = agent.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;

        // One day in milliseconds
        const oneDay = 1000 * 60 * 60 * 24;

        // Calculate the time difference in milliseconds
        const timeDiff = Math.abs(new Date(refreshTokenCookie.expiration_date).getTime() - dateToday.getTime());

        // Convert milliseconds to days
        const daysDiff = Math.round(timeDiff / oneDay);

        expect(daysDiff).toEqual(1);
      });
    });

    describe('error', () => {
      it('should return validation error messages if required fields are missing', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/login').send({});

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "email" field is required');
        expect(res.body.data[1]).toHaveProperty('message', 'The "password" field is required');
        expect(res.body.data[2]).toHaveProperty('message', 'The "rememberMe" field is required');
      });

      it('should return a validation error message if the email is not valid', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/login').send({
          email: 'invalid',
          password: userPassword,
          rememberMe: true,
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "email" field should be a valid email');
      });

      it('should return a validation error message if the password is less than 6 characters', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/login').send({
          email: userEmail,
          password: 'short',
          rememberMe: true,
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "password" field should have a minimum length of 6 characters');
      });

      it('should catch errors during authentication', async () => {
        Container.set(AuthService, {
          authenticateUser: jest.fn().mockRejectedValueOnce(new NotFoundError(`User with email '${userEmail}' does not exist.`)),
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/login').send({
          email: userEmail,
          password: userPassword,
          rememberMe: true,
        });

        expect(res.status).toEqual(HttpStatusCodes.NOT_FOUND);
        expect(res.body.message).toContain(`User with email '${userEmail}' does not exist.`);
      });
    });
  });

  describe('GET /{API PREFIX}/auth/activate/:code', () => {
    const activationCode = 'eeHieSoo6Ziequ0opidieVau';

    describe('success', () => {
      it('should activate a user using the provided code', async () => {
        const mockActivateUser = jest.fn().mockResolvedValueOnce({
          data: {
            name: userName,
            email: userEmail,
            isActivated: true,
          },
        });

        Container.set(AuthService, {
          activateUser: mockActivateUser,
        });

        const res = await request(ExpressAppInstance['app']).get(`/api/v2/auth/activate/${activationCode}`);

        expect(mockActivateUser).toHaveBeenCalled();
        expect(mockActivateUser.mock.calls[0][0]).toEqual(activationCode);
        expect(res.status).toEqual(HttpStatusCodes.OK);
        expect(res.body.message).toContain(`User with email '${userEmail}' successfully activated.`);
      });
    });

    describe('error', () => {
      it('should catch error when activating a user', async () => {
        Container.set(AuthService, {
          activateUser: jest.fn().mockRejectedValueOnce(new ForbiddenError(`User account with activation code '${activationCode}' is already activated.`)),
        });

        const res = await request(ExpressAppInstance['app']).get(`/api/v2/auth/activate/${activationCode}`);

        expect(res.status).toEqual(HttpStatusCodes.FORBIDDEN);
        expect(res.body.message).toContain(`User account with activation code '${activationCode}' is already activated.`);
      });
    });
  });

  describe('POST /{API PREFIX}/auth/reset/link', () => {
    describe('success', () => {
      it('should create a reset token and send an email with a reset password link', async () => {
        const mockCreateResetToken = jest.fn().mockResolvedValueOnce({
          data: {
            email: userEmail,
            token: salt,
          },
        });
        const mockResetPasswordEmail = jest.fn().mockResolvedValueOnce({
          message: 'MAIL_SENT',
        });

        Container.set(AuthService, {
          createResetToken: mockCreateResetToken,
        });
        Container.set(MailerService, {
          sendResetPasswordEmail: mockResetPasswordEmail,
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/reset/link').send({
          email: userEmail,
        });

        expect(mockCreateResetToken).toHaveBeenCalled();
        expect(mockResetPasswordEmail).toHaveBeenCalled();
        expect(res.status).toEqual(HttpStatusCodes.CREATED);
        expect(res.body.message).toContain(`A password reset link has been sent to '${userEmail}'.`);
      });
    });

    describe('error', () => {
      it('should return validation error messages if required fields are missing', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/reset/link').send({});

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "email" field is required');
      });

      it('should return validation error messages if required fields are missing', async () => {
        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/reset/link').send({
          email: 'invalid',
        });

        expect(res.status).toEqual(HttpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.message).toContain('There are validation errors in your request.');
        expect(res.body.data[0]).toHaveProperty('message', 'The "email" field should be a valid email');
      });

      it('should catch errors when creating a reset token', async () => {
        Container.set(AuthService, {
          createResetToken: jest.fn().mockRejectedValueOnce(new NotFoundError(`User with email '${userEmail}' does not exist.`)),
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/reset/link').send({
          email: userEmail,
        });

        expect(res.status).toEqual(HttpStatusCodes.NOT_FOUND);
        expect(res.body.message).toContain(`User with email '${userEmail}' does not exist.`);
      });

      it('should catch errors when sending the reset email', async () => {
        Container.set(AuthService, {
          createResetToken: jest.fn().mockResolvedValueOnce({
            data: {
              email: userEmail,
              token: salt,
            },
          }),
        });
        Container.set(MailerService, {
          sendResetPasswordEmail: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_MAIL_ERROR')),
        });

        const res = await request(ExpressAppInstance['app']).post('/api/v2/auth/reset/link').send({
          email: userEmail,
        });

        expect(res.status).toEqual(HttpStatusCodes.INTERNAL_SERVER);
        expect(res.body.message).toContain('SAMPLE_MAIL_ERROR');
      });
    });
  });
});
