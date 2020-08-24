// shared.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { SharedController } from './shared.controller';

export class SharedRouter {
  public static router() {
    const router: Router = Router();

    router.put('/assign', Wrapper.wrapAsync(SharedController.assignGroup));
    router.get('/stats', Wrapper.wrapAsync(SharedController.getStatistics));

    return router;
  }
}
