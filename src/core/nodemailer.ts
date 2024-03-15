import ejs from 'ejs';
import { Service } from 'typedi';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';

import configs from '@src/configs';
import { viewPath } from '@src/utils/path';
import { AppResponse } from '@src/shared/interfaces/responses';

@Service()
export default class Mailer {
  private transporter: Transporter;

  constructor() {
    /**
     * Required type casting: SMTPTransport.Options,
     * otherwise will default to TransportOptions type
     *
     * @link https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35847#issuecomment-638091133
     */
    this.transporter = createTransport(<SMTPTransport.Options>{
      host: configs.mail.host,
      port: configs.mail.port,
      secure: configs.mail.encryption, // ssl
      auth: {
        user: configs.mail.credentials.username,
        pass: configs.mail.credentials.password,
      },
    });
  }

  public async send(receiver: string, subject: string, messageOptions: ejs.Data, view: string): Promise<AppResponse<null>> {
    // send mail with defined transport object
    try {
      const viewResponse = await this.getViewData(view, messageOptions);
      const mailOptions: SendMailOptions = {
        from: `"${configs.mail.from.name}" ${configs.mail.from.address}`,
        to: receiver,
        subject: subject,
        html: viewResponse.data, // html body
      };
      const mailResponse = await this.transporter.sendMail(mailOptions);

      return { message: mailResponse.response };
    } catch (err) {
      throw err;
    }
  }

  private async getViewData(view: string, dataOptions: ejs.Data): Promise<AppResponse<string>> {
    try {
      /**
       * Using ejs template for mail views
       *
       * @link https://stackoverflow.com/questions/41304922/sending-ejs-template-using-nodemailer#answer-41337102
       */
      const data = await ejs.renderFile(viewPath(`emails/${view}.ejs`), dataOptions);

      return { data };
    } catch (err) {
      throw err;
    }
  }
}
