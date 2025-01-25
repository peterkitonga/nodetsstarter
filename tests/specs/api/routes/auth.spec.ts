import { Container } from 'typedi';
import request from 'supertest';
import configs from '@src/configs';
import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import AuthService from '@src/services/auth';
import MailerService from '@src/services/mailer';
import { HttpStatusCodes } from '@src/shared/enums';
import MongooseConnect from '@src/core/mongoose';

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
  });
});
