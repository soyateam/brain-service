// shared.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { SharedController } from './shared.controller';
import { PermissionHandler } from '../permissions/permission.handler';

export class SharedRouter {
  public static router() {
    const router: Router = Router();

    router.put(
      '/assign',
      Wrapper.wrapAsync(PermissionHandler.createOrUpdate),
      Wrapper.wrapAsync(SharedController.assignGroup),
    );
    router.get(
      '/stats',
      Wrapper.wrapAsync(PermissionHandler.get),
      Wrapper.wrapAsync(SharedController.getStatistics),
    );

    return router;
  }
}
