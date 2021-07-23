import { Router } from 'express';

import AuthController from '../controllers/auth';
import AuthValidator from '../middlewares/validation/auth';

export default (appRouter: Router): void => {
  appRouter.use('/auth', appRouter);

  appRouter.post('/register', AuthValidator.registerUser, AuthController.registerUser);
  appRouter.post('/login', AuthValidator.authenticateUser, AuthController.authenticateUser);
};
