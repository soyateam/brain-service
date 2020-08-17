// group.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { GroupController } from './group.controller';

export class GroupRouter {
  public static router() {
    const router: Router = Router();

    router.get('/:id/children', Wrapper.wrapAsync(GroupController.getOrganizationChildren));
    router.get('/:id', Wrapper.wrapAsync(GroupController.getOrganization));

    return router;
  }
}
