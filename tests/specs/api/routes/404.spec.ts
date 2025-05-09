import request from 'supertest';
import configs from '@src/configs';
import { Container } from 'typedi';

import ExpressApp from '@src/core/express';
import WinstonLogger from '@src/core/winston';
import { HttpStatusCodes } from '@src/shared/enums';

describe('404', () => {
  it('should return a message for non existing routes', async () => {
    configs.app.api.version = 'v2';
    configs.filesystems.limit = '10mb';

    Container.set(WinstonLogger, {
      info: jest.fn(),
      error: jest.fn(),
    });

    const ExpressAppInstance = Container.get(ExpressApp);

    ExpressAppInstance.setupBodyParser();
    ExpressAppInstance.setupCookieParser();
    ExpressAppInstance.handleAppRoutes();
    ExpressAppInstance.handleNonExistingRoute();
    ExpressAppInstance.handleErrorMiddleware();

    const res = await request(ExpressAppInstance['app']).get('/api/v2/non/existing').set('Accept', 'application/json');

    expect(res.status).toEqual(HttpStatusCodes.NOT_FOUND);
    expect(res.body.message).toContain(`GET route for '/api/v2/non/existing' not found`);
  });
});
