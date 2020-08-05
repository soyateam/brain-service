// hierarchy.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { HierarchyController } from './hierarchy.controller';

export class HierarchyRouter {
  get router() {
    const router: Router = Router();

    router.get('/:id/children', Wrapper.wrapAsync(HierarchyController.getOrganizationChildren));
    router.get('/:id', Wrapper.wrapAsync(HierarchyController.getOrganization));

    return router;
  }
}
