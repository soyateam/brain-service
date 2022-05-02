// task.validator

import { ITask, TaskType } from './task.interface';
import { InvalidTaskName, InvalidTaskDescription } from './task.error';
import taskModel from './task.model';

export class TaskValidator {

  static isValid(task: ITask) {
    return (
      task &&
      task.name &&
      task.type
    );
  }

  static isNameValid(name: string): boolean {
    if (typeof name === 'string') {
      return true;
    }

    throw new InvalidTaskName();
  }

  static isDescriptionValid(description: string): boolean {
    if (typeof description === 'string') {
      return true;
    }

    throw new InvalidTaskDescription();
  }

  static isTypeValid(type: string) {
    return (Object.keys(TaskType).indexOf(type) !== -1);
  }

  static async isParentValid(parent: string) {
    // In case the task is root task
    let valid = true;

    // If not, it must be sub task of already created task
    if (!!parent) {
      valid = !!(await taskModel.findOne({ _id: parent }).lean());
    }

    return valid;
  }

  static async isAncestorsValid(ancestors: [string]) {
    const ancestorsFromDB = await taskModel.find({ _id: { $in: ancestors } }).lean();

    return ancestorsFromDB.length === ancestors.length;
  }

}
