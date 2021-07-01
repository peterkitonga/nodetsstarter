export default {
  port: process.env.APP_PORT,
  base: process.env.APP_BASE_URL,
  api: {
    version: 'v1',
    prefix(): string {
      return `/api/${this.version}`;
    },
  },
  locale: process.env.APP_LOCALE,
  timezone: process.env.APP_TIMEZONE,
};
