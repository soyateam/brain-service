// task.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { TaskController } from './task.controller';

export class TaskRouter {
  public static router() {
    const router: Router = Router();
    router.get('/type/:type',
               Wrapper.wrapAsync(TaskController.getTasksByType));
    router.get('/parent/:parentId', Wrapper.wrapAsync(TaskController.getTasksByParentId));
    router.get('/:id', Wrapper.wrapAsync(TaskController.getTaskById));
    router.post('/', Wrapper.wrapAsync(TaskController.createTask));
    router.put('/', Wrapper.wrapAsync(TaskController.updateTask));
    router.delete('/:id', Wrapper.wrapAsync(TaskController.deleteTask));

    return router;
  }
}
