import fs from 'fs';

jest.spyOn(fs, 'accessSync').mockImplementation();

process.env.APP_ALLOWED_ORIGINS = 'http://127.0.0.1:4200,http://localhost:4200';
process.env.AWS_ACCESS_KEY_ID = 'SAMPLE_KEY_ID';
process.env.AWS_ACCESS_SECRET = 'SAMPLE_ACCESS_SECRET';
process.env.AWS_ACCESS_ENDPOINT = 'SAMPLE_ACCESS_ENDPOINT';
process.env.AWS_BUCKET_OWNER_ID = 'SAMPLE_BUCKET_OWNER_ID';
process.env.AWS_BUCKET_REGION = 'SAMPLE_BUCKET_REGION';
process.env.AWS_BUCKET_NAME = 'SAMPLE_BUCKET_NAME';

process.env.MONGO_PROVIDER = 'atlas';
process.env.MONGO_HOST = 'example';
process.env.MONGO_PORT = '10000';
process.env.MONGO_USERNAME = 'test';
process.env.MONGO_PASSWORD = 'password';
process.env.MONGO_DATABASE = 'database';

process.env.MAIL_HOST = 'smtp.example.com';
process.env.MAIL_PORT = '444';
process.env.MAIL_USERNAME = 'hello@test.com';
process.env.MAIL_PASSWORD = '12345';
process.env.MAIL_FROM_NAME = 'SAMPLE_FROM_NAME';
process.env.MAIL_FROM_ADDRESS = 'SAMPLE_FROM_ADDRESS';
process.env.MAIL_ENCRYPTION = 'false';
