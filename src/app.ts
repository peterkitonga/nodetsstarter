import 'reflect-metadata';
import { Container } from 'typedi';

import ExpressApp from '@src/core/express';

const expressApp = Container.get(ExpressApp);

expressApp.init();
