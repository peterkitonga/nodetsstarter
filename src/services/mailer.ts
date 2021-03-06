import configs from '../configs';
import Mailer from '../loaders/nodemailer';
import { ResultResponse } from '../common/interfaces/responses';

export default class MailerService {
  private email: string;

  public constructor(email: string) {
    this.email = email;
  }

  public async sendWelcomeEmail(code: string): Promise<ResultResponse<null>> {
    try {
      const sendMail = await Mailer.send(
        this.email,
        `Welcome to ${configs.app.name}`,
        { message: 'Thank you for registering with us. Please click the link below to activate your account.', code },
        'welcome',
      );

      return sendMail;
    } catch (err) {
      throw err;
    }
  }

  public async sendResetPasswordEmail(token: string): Promise<ResultResponse<null>> {
    try {
      const sendMail = await Mailer.send(
        this.email,
        `${configs.app.name} reset password`,
        {
          message:
            'A password reset was requested for this account. Please click the link below to reset your password. Ignore if this was not requested by you, nothing will change.',
          token,
        },
        'reset',
      );

      return sendMail;
    } catch (err) {
      throw err;
    }
  }
}
