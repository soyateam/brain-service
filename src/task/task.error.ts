// task.error

import { InvalidParameter } from '../utils/error';

export class InvalidTaskName extends InvalidParameter {
  constructor(message?: string) {
    super(message || 'Invalid task name provided');
  }
}

export class InvalidTaskDescription extends InvalidParameter {
  constructor(message?: string) {
    super(message || 'Invalid task description provided');
  }
}

export class InvalidParentTask extends InvalidParameter {
  constructor(message?: string) {
    super(message || 'Invalid task parent provided');
  }
}
