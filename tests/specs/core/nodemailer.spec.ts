import { Container } from 'typedi';
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';
import Mailer from '@src/core/nodemailer';

describe('src/core/nodemailer', () => {
  const view = 'welcome';
  const recipient = 'test@user.com';
  const subject = 'TEST_SUBJECT';
  const messageOptions = { message: 'MESSAGE' };

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe('send()', () => {
    describe('success', () => {
      it('should fetch email templates from the view folder', async () => {
        const mockPathJoin = jest.spyOn(path, 'join');
        const mockRenderFile = (ejs.renderFile = jest.fn().mockResolvedValue('<span>TEST</span>'));

        nodemailer.createTransport = jest.fn().mockImplementation(() => ({
          sendMail: jest.fn().mockResolvedValue({ response: 'SAMPLE_MAIL_RESPONSE' }),
        }));

        await Container.get(Mailer).send(recipient, subject, messageOptions, view);

        expect(mockPathJoin).toHaveBeenCalled();
        expect(mockRenderFile).toHaveBeenCalled();
        expect(mockPathJoin.mock.calls.pop()).toContain('../../views');
      });

      it('should use nodemailer to send emails', async () => {
        const mockSendMail = jest.fn().mockResolvedValue({ response: 'SAMPLE_MAIL_RESPONSE' });

        jest.spyOn(path, 'join');
        ejs.renderFile = jest.fn().mockResolvedValue('<span>TEST</span>');
        nodemailer.createTransport = jest.fn().mockImplementation(() => ({
          sendMail: mockSendMail,
        }));

        await Container.get(Mailer).send(recipient, subject, messageOptions, view);

        expect(mockSendMail).toHaveBeenCalled();
      });

      it('should return a response with a message', async () => {
        jest.spyOn(path, 'join');
        ejs.renderFile = jest.fn().mockResolvedValue('<span>TEST</span>');
        nodemailer.createTransport = jest.fn().mockImplementation(() => ({
          sendMail: jest.fn().mockResolvedValue({ response: 'SAMPLE_MAIL_RESPONSE' }),
        }));

        const response = await Container.get(Mailer).send(recipient, subject, messageOptions, view);

        expect(response).toHaveProperty('message', 'SAMPLE_MAIL_RESPONSE');
      });
    });

    describe('error', () => {
      it('should catch errors while rendering the email templates', async () => {
        jest.spyOn(path, 'join');
        ejs.renderFile = jest.fn().mockRejectedValueOnce(new Error('SAMPLE_RENDER_ERROR'));
        nodemailer.createTransport = jest.fn().mockImplementation(() => ({
          sendMail: jest.fn().mockResolvedValue({ response: 'SAMPLE_MAIL_RESPONSE' }),
        }));

        await expect(Container.get(Mailer).send(recipient, subject, messageOptions, view)).rejects.toHaveProperty('message', 'SAMPLE_RENDER_ERROR');
      });

      it('should catch errors while sending emails', async () => {
        jest.spyOn(path, 'join');
        ejs.renderFile = jest.fn().mockResolvedValue('<span>TEST</span>');
        nodemailer.createTransport = jest.fn().mockImplementation(() => ({
          sendMail: jest.fn().mockRejectedValueOnce(new Error('SAMPLE_SEND_MAIL_ERROR')),
        }));

        await expect(Container.get(Mailer).send(recipient, subject, messageOptions, view)).rejects.toHaveProperty('message', 'SAMPLE_SEND_MAIL_ERROR');
      });
    });
  });
});
