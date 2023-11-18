export default {
  host: process.env['MAIL_HOST'],
  port: Number(process.env['MAIL_PORT']),
  credentials: {
    username: process.env['MAIL_USERNAME'],
    password: process.env['MAIL_PASSWORD'],
  },
  from: {
    name: process.env['MAIL_FROM_NAME'],
    address: process.env['MAIL_FROM_ADDRESS'],
  },
  encryption: process.env['MAIL_ENCRYPTION'],
};
