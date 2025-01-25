import { Container } from 'typedi';

import configs from '@src/configs';
import Mailer from '@src/core/nodemailer';
import MailerService from '@src/services/mailer';

describe('src/services/mailer', () => {
  const email = 'user@test.com';

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail()', () => {
    describe('success', () => {
      it('should send a welcome email', async () => {
        const mockMailSend = jest.fn().mockResolvedValueOnce({ message: 'SAMPLE_MESSAGE' });

        configs.app.name = 'SAMPLE_APP_NAME';
        Container.set(Mailer, {
          send: mockMailSend,
        });

        await Container.get(MailerService).sendWelcomeEmail(email, 'SAMPLE_CODE');

        expect(mockMailSend).toHaveBeenCalled();
        expect(mockMailSend.mock.calls[0][0]).toEqual(email);
        expect(mockMailSend.mock.calls[0][1]).toContain('Welcome to SAMPLE_APP_NAME');
      });
    });

    describe('error', () => {
      it('should catch errors when sending an email', async () => {
        Container.set(Mailer, {
          send: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_MAIL_ERROR')),
        });

        await expect(Container.get(MailerService).sendWelcomeEmail(email, 'SAMPLE_CODE')).rejects.toHaveProperty('message', 'SAMPLE_MAIL_ERROR');
      });
    });
  });

  describe('sendResetPasswordEmail()', () => {
    describe('success', () => {
      it('should send a password reset email', async () => {
        const mockMailSend = jest.fn().mockResolvedValueOnce({ message: 'SAMPLE_MESSAGE' });

        configs.app.name = 'SAMPLE_APP_NAME';
        Container.set(Mailer, {
          send: mockMailSend,
        });

        await Container.get(MailerService).sendResetPasswordEmail(email, 'SAMPLE_TOKEN');

        expect(mockMailSend).toHaveBeenCalled();
        expect(mockMailSend.mock.calls[0][0]).toEqual(email);
        expect(mockMailSend.mock.calls[0][1]).toContain('SAMPLE_APP_NAME reset password');
      });
    });

    describe('error', () => {
      it('should catch errors when sending an email', async () => {
        Container.set(Mailer, {
          send: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_MAIL_ERROR')),
        });

        await expect(Container.get(MailerService).sendResetPasswordEmail(email, 'SAMPLE_TOKEN')).rejects.toHaveProperty('message', 'SAMPLE_MAIL_ERROR');
      });
    });
  });
});
