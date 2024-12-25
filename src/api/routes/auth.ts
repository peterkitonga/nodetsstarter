import { Router } from 'express';
import { Container } from 'typedi';

import AuthController from '@src/api/controllers/auth';
import AuthCheck from '@src/api/middlewares/check/auth';
import AuthValidator from '@src/api/middlewares/validators/auth';

const authRouter = Router();
const authValidator = Container.get(AuthValidator);
const authController = Container.get(AuthController);
const authCheck = Container.get(AuthCheck);

export default (router: Router): void => {
  router.use('/auth', authRouter);

  authRouter.post('/register', authValidator.registerUser, authController.registerUser);
  authRouter.post('/login', authValidator.authenticateUser, authController.authenticateUser);
  authRouter.get('/activate/:code', authController.activateUser);
  authRouter.post('/reset/link', authValidator.sendResetLink, authController.sendResetLink);
  authRouter.post('/reset/password', authValidator.resetPassword, authController.resetPassword);
  authRouter.get('/refresh/token', authController.refreshToken);
  authRouter.get('/user', authCheck.verifyToken, authController.getUser);
  authRouter.put('/user', authCheck.verifyToken, authValidator.updateUser, authController.updateUser);
  authRouter.put('/user/avatar', authCheck.verifyToken, authValidator.updateAvatar, authController.updateAvatar);
  authRouter.put('/user/password', authCheck.verifyToken, authValidator.updatePassword, authController.updatePassword);
  authRouter.get('/logout', authCheck.verifyToken, authController.logoutUser);
};
