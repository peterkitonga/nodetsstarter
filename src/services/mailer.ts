import configs from '@src/configs';
import Mailer from '@src/loaders/nodemailer';
import { AppResponse } from '@src/shared/interfaces/responses';

export default class MailerService {
  public constructor(private email: string) {
    //
  }

  public async sendWelcomeEmail(code: string): Promise<AppResponse<null>> {
    try {
      return await Mailer.send(
        this.email,
        `Welcome to ${configs.app.name}`,
        { message: 'Thank you for registering with us. Please click the link below to activate your account.', code },
        'welcome',
      );
    } catch (err) {
      throw err;
    }
  }

  public async sendResetPasswordEmail(token: string): Promise<AppResponse<null>> {
    try {
      return await Mailer.send(
        this.email,
        `${configs.app.name} reset password`,
        {
          message:
            'A password reset was requested for this account. Please click the link below to reset your password. Ignore if this was not requested by you, nothing will change.',
          token,
        },
        'reset',
      );
    } catch (err) {
      throw err;
    }
  }
}
