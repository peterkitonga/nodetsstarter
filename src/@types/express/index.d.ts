import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: string;
      salt?: string;
    }
  }
}
