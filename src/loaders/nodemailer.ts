import ejs from 'ejs';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';

import configs from '../configs';
import { viewPath } from '../utils/path';
import { ResultResponse } from '../common/interfaces/responses';

class Mailer {
  private transporter: Transporter;

  public constructor() {
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

  public send(
    receiver: string,
    subject: string,
    messageOptions: ejs.Data,
    view: string,
  ): Promise<ResultResponse<null>> {
    // send mail with defined transport object
    return this.getViewData(view, messageOptions)
      .then((viewResponse) => {
        if (viewResponse.status === 'success') {
          const mailOptions: SendMailOptions = {
            from: `"${configs.mail.from.name}" ${configs.mail.from.address}`, // sender address (who sends)
            to: receiver, // list of receivers (who receives)
            subject: subject, // subject line
            html: viewResponse.data, // html body
          };

          return this.transporter.sendMail(mailOptions);
        } else {
          throw new Error(viewResponse.message);
        }
      })
      .then((mailResponse) => {
        if ('response' in mailResponse) {
          return Promise.resolve({ status: 'success', message: mailResponse.response });
        } else {
          throw mailResponse.error;
        }
      })
      .catch((err) => {
        return Promise.reject({ status: 'error', message: err.message });
      });
  }

  private getViewData(view: string, dataOptions: ejs.Data): Promise<ResultResponse<string>> {
    return new Promise((resolve, reject) => {
      /**
       * Using ejs template for mail views
       *
       * @link https://stackoverflow.com/questions/41304922/sending-ejs-template-using-nodemailer#answer-41337102
       */
      ejs.renderFile(viewPath(`emails/${view}.ejs`), dataOptions, (fileErr, data) => {
        if (fileErr) {
          reject({ status: 'error', message: fileErr.message });
        } else {
          resolve({ status: 'success', data: data });
        }
      });
    });
  }
}

export default new Mailer();
