import { storagePath } from '../utils/path';

export default {
  provider: process.env.FILE_SYSTEM_PROVIDER ?? 'local',
  limit: process.env.FILE_SYSTEM_LIMIT ?? '200kb',
  providers: {
    local: {
      dir: storagePath('app/public'),
      url: `${process.env.APP_BASE_URL}/storage`,
    },
    s3: {},
  },
};
