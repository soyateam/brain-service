// task.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { TaskController } from './task.controller';

export class TaskRouter {
  get router() {
    const router: Router = Router();

    router.get('/parent/:id', Wrapper.wrapAsync(TaskController.getTasksByParentId));
    router.get('/stats/:type', Wrapper.wrapAsync(TaskController.getStats));
    router.get('/:id', Wrapper.wrapAsync(TaskController.getTaskById));
    router.post('/', Wrapper.wrapAsync(TaskController.createTask));
    router.delete('/:id', Wrapper.wrapAsync(TaskController.deleteTask));

    return router;
  }
}
