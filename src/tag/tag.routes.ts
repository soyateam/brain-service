// tag.routes

import { Router } from 'express';
import { Wrapper } from '../utils/wrapper';
import { TagController } from './tag.controller';

export class TaskRouter {
  get router() {
    const router: Router = Router();

    router.get('/', Wrapper.wrapAsync(TagController.getTags));
    router.get('/:id', Wrapper.wrapAsync(TagController.getTagById));
    router.post('/', Wrapper.wrapAsync(TagController.addTag));
    router.delete('/:id', Wrapper.wrapAsync(TagController.deleteTag));

    return router;
  }
}
