import { Router } from 'express';
import { Container } from 'typedi';

import AuthController from '@src/api/controllers/auth';
import AuthCheck from '@src/api/middlewares/check/auth';
import AuthValidator from '@src/api/middlewares/validation/auth';

const authRouter = Router();
const authController = Container.get(AuthController);

export default (router: Router): void => {
  router.use('/auth', authRouter);

  authRouter.post('/register', AuthValidator.registerUser, authController.registerUser);
  authRouter.post('/login', AuthValidator.authenticateUser, authController.authenticateUser);
  authRouter.get('/activate/:code', authController.activateUser);
  authRouter.post('/send/reset/link', AuthValidator.sendResetLink, authController.sendResetLink);
  authRouter.post('/reset/password', AuthValidator.resetPassword, authController.resetPassword);
  authRouter.get('/refresh/token', authController.refreshToken);
  authRouter.get('/user', AuthCheck.verifyToken, authController.getUser);
  authRouter.put('/update/user', AuthCheck.verifyToken, AuthValidator.updateUser, authController.updateUser);
  authRouter.put('/update/avatar', AuthCheck.verifyToken, AuthValidator.updateAvatar, authController.updateAvatar);
  authRouter.put(
    '/update/password',
    AuthCheck.verifyToken,
    AuthValidator.updatePassword,
    authController.updatePassword,
  );
  authRouter.get('/logout', AuthCheck.verifyToken, authController.logoutUser);
};
