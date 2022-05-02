// task.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { TaskController } from './task.controller';
import { PermissionHandler } from '../permissions/permission.handler';

export class TaskRouter {
  public static router() {
    const router: Router = Router();
    /** @deprecated */
    // router.get(
    //   '/type/:type',
    //   Wrapper.wrapAsync(PermissionHandler.get),
    //   Wrapper.wrapAsync(TaskController.getTasksByType),
    // );
    router.get(
      '/parent/:parentId?',
      Wrapper.wrapAsync(PermissionHandler.get),
      Wrapper.wrapAsync(TaskController.getTasksByParentId),
    );
    router.get(
      '/:id',
      Wrapper.wrapAsync(PermissionHandler.get),
      Wrapper.wrapAsync(TaskController.getTaskById),
    );
    router.post(
      '/',
      Wrapper.wrapAsync(PermissionHandler.createOrUpdate),
      Wrapper.wrapAsync(TaskController.createTask),
    );
    router.put(
      '/',
      Wrapper.wrapAsync(PermissionHandler.createOrUpdate),
      Wrapper.wrapAsync(TaskController.updateTask),
    );
    router.delete(
      '/:id',
      Wrapper.wrapAsync(PermissionHandler.createOrUpdate),
      Wrapper.wrapAsync(TaskController.deleteTask),
    );

    return router;
  }
}
