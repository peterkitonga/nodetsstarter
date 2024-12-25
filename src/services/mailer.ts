import { Service } from 'typedi';

import configs from '@src/configs';
import Mailer from '@src/core/nodemailer';
import { AppResponse } from '@src/shared/interfaces/responses';

@Service()
export default class MailerService {
  constructor(private mailer: Mailer) {
    //
  }

  public async sendWelcomeEmail(email: string, code: string): Promise<AppResponse<null>> {
    try {
      return await this.mailer.send(
        email,
        `Welcome to ${configs.app.name}`,
        { message: 'Thank you for registering with us. Please click the link below to activate your account.', code },
        'welcome',
      );
    } catch (err) {
      throw err;
    }
  }

  public async sendResetPasswordEmail(email: string, token: string): Promise<AppResponse<null>> {
    try {
      return await this.mailer.send(
        email,
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
