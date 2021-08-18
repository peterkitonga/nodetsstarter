import { Router } from 'express';

import AuthController from '../controllers/auth';
import AuthCheck from '../middlewares/check/auth';
import AuthValidator from '../middlewares/validation/auth';

const authRouter = Router();

export default (appRouter: Router): void => {
  appRouter.use('/auth', authRouter);

  authRouter.post('/register', AuthValidator.registerUser, AuthController.registerUser);
  authRouter.post('/login', AuthValidator.authenticateUser, AuthController.authenticateUser);
  authRouter.get('/activate/:code', AuthController.activateUser);
  authRouter.post('/send/reset/link', AuthValidator.sendResetLink, AuthController.sendResetLink);
  authRouter.post('/reset/password', AuthValidator.resetPassword, AuthController.resetPassword);
  authRouter.get('/refresh/token', AuthController.refreshToken);
  authRouter.get('/user', AuthCheck.verifyToken, AuthController.getUser);
  authRouter.put('/update/user', AuthCheck.verifyToken, AuthValidator.updateUser, AuthController.updateUser);
  authRouter.put('/update/avatar', AuthCheck.verifyToken, AuthValidator.updateAvatar, AuthController.updateAvatar);
  authRouter.put(
    '/update/password',
    AuthCheck.verifyToken,
    AuthValidator.updatePassword,
    AuthController.updatePassword,
  );
  authRouter.get('/logout', AuthCheck.verifyToken, AuthController.logoutUser);
};
