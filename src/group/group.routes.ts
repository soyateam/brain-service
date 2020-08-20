// group.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { GroupController } from './group.controller';

export class GroupRouter {
  public static router() {
    const router: Router = Router();

    router.get('/parent/:id', Wrapper.wrapAsync(GroupController.getGroupsByParent));
    router.get('/:id', Wrapper.wrapAsync(GroupController.getGroupById));

    return router;
  }
}
