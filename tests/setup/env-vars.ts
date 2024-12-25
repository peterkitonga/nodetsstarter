import fs from 'fs';

jest.spyOn(fs, 'accessSync').mockImplementation();

process.env.APP_ALLOWED_ORIGINS = 'http://127.0.0.1:4200,http://localhost:4200';
