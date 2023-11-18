import { Router } from 'express';

import auth from '@src/api/routes/auth';

const router = Router();

export default (): Router => {
  auth(router);

  return router;
};
