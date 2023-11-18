import { storagePath } from '@src/utils/path';

export default {
  provider: process.env['FILE_SYSTEM_PROVIDER'] || 'local',
  limit: process.env['FILE_SYSTEM_LIMIT'] || '200kb',
  providers: {
    local: {
      dir: storagePath('app/public'),
      url: `${process.env['APP_BASE_URL']}/storage`,
    },
    s3: {
      key: process.env['AWS_ACCESS_KEY_ID'],
      secret: process.env['AWS_ACCESS_SECRET'],
      endpoint: process.env['AWS_ACCESS_ENDPOINT'],
      owner: process.env['AWS_BUCKET_OWNER_ID'],
      region: process.env['AWS_BUCKET_REGION'],
      bucket: process.env['AWS_BUCKET_NAME'],
    },
  },
};
