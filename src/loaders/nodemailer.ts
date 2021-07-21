import ejs from 'ejs';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';

import configs from '../configs';
import { viewPath } from '../utils/path';
import { ResultResponse } from '../common/interfaces/responses';

export default class Mailer {
  /**
   * Required type casting: SMTPTransport.Options,
   * otherwise will default to TransportOptions type
   *
   * @link https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35847#issuecomment-638091133
   */
  private static transporter: Transporter = createTransport(<SMTPTransport.Options>{
    host: configs.mail.host,
    port: configs.mail.port,
    secure: configs.mail.encryption, // ssl
    auth: {
      user: configs.mail.credentials.username,
      pass: configs.mail.credentials.password,
    },
  });

  public constructor() {
    // constructor
  }

  public static send(
    receiver: string,
    subject: string,
    message_options: ejs.Data,
    view: string,
  ): Promise<ResultResponse<null>> {
    // send mail with defined transport object
    return new Promise((resolve, reject) => {
      /**
       * Using ejs template for mail views
       *
       * @link https://stackoverflow.com/questions/41304922/sending-ejs-template-using-nodemailer#answer-41337102
       */
      ejs.renderFile(viewPath(`emails/${view}.ejs`), message_options, (fileErr, data) => {
        if (fileErr) {
          reject({ status: 'error', message: fileErr.message });
        } else {
          const mail_options: SendMailOptions = {
            from: `"${configs.mail.from.name}" ${configs.mail.from.address}`, // sender address (who sends)
            to: receiver, // list of receivers (who receives)
            subject: subject, // subject line
            html: data, // html body
          };

          this.transporter.sendMail(mail_options, (mailErr, info) => {
            if (mailErr) {
              reject({ status: 'error', message: mailErr.message });
            } else {
              resolve({ status: 'success', message: `Message sent: ${info.response}` });
            }
          });
        }
      });
    });
  }
}
