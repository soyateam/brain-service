// shared.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { SharedController } from './shared.controller';

export class GroupRouter {
  public static router() {
    const router: Router = Router();

    // router.get('/stats/:type', Wrapper.wrapAsync(SharedController.getOrganizationChildren));
    // router.get('/', Wrapper.wrapAsync(SharedController.getOrganization));

    return router;
  }
}
