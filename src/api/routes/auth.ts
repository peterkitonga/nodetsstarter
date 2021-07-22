import { Router } from 'express';

import AuthController from '../controllers/auth';

const authControllerInit = new AuthController();

export default (appRouter: Router): void => {
  appRouter.use('/auth', appRouter);

  appRouter.post('/register', authControllerInit.registerUser);
  appRouter.post('/login', authControllerInit.authenticateUser);
};
