// group.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { GroupController } from './group.controller';
import { PermissionHandler } from '../permissions/permission.handler';

export class GroupRouter {
  public static router() {
    const router: Router = Router();
    
    router.get(
      '/parent/:id?',
      Wrapper.wrapAsync(PermissionHandler.get),
      Wrapper.wrapAsync(GroupController.getGroupsByParent)
    );
    router.get(
      '/:id',
      Wrapper.wrapAsync(PermissionHandler.get),
      Wrapper.wrapAsync(GroupController.getGroupById)
    );

    return router;
  }
}
