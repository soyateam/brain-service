// shared.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { InvalidParameter, BadRequest } from '../utils/error';
import { IGroup } from '../task/task.interface';

export class SharedController {
  private static readonly ERROR_MESSAGES = {
    INVALID_PARAMETER: 'Invalid paramters were given.',
    NO_PARENT: 'Cannot assign to a task without a parent.',
    UNEXISTING_GROUP: 'Cannot find an unexisting group.',
    DUPLICATE_GROUP: 'Cannot assign duplicate groups',
  };

  private static readonly groupUrl = `${config.groupServiceUrl}/api/group`;
  private static readonly taskUrl = `${config.taskServiceUrl}/task`;

  /**
   * Assigns a task to a group, and updates the
   * group's assignedCount.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async assignGroup(req: Request, res: Response) {
    if (!req.body.taskId ||
        !req.body.group ||
        !('isCountGrow' in req.body) ||
        typeof(req.body.isCountGrow) !== 'boolean') {
      throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
    }

    const oldTask = await HttpClient.get(`${SharedController.taskUrl}/${req.body.taskId}`);

    // If the task's parent is null, throw error.
    if (!oldTask.parent) {
      throw new BadRequest(SharedController.ERROR_MESSAGES.NO_PARENT);
    }

    if (req.body.isCountGrow) {
      // Add the group to the groups array of the task.
      oldTask.groups.push(req.body.group);
    } else {
      if (oldTask.groups && oldTask.groups.length === 0) {
        throw new BadRequest(SharedController.ERROR_MESSAGES.UNEXISTING_GROUP);
      }

      let isFound = false;

      for (const currIndex in oldTask.groups) {
        if (oldTask.groups[currIndex].id === req.body.group.id) {
          oldTask.groups.splice(currIndex, 1);
          isFound = true;
          break;
        }

        if (!isFound) {
          throw new BadRequest(SharedController.ERROR_MESSAGES.UNEXISTING_GROUP);
        }
      }
    }

    // Remove any duplicates if exist.
    const newGroups = SharedController.toUniqueGroupArray(oldTask.groups);
    if (JSON.stringify(newGroups) !== JSON.stringify(oldTask.groups)) {
      throw new BadRequest(SharedController.ERROR_MESSAGES.DUPLICATE_GROUP);
    }

    const task = await HttpClient.put(SharedController.taskUrl, { task: oldTask });

    if (task) {
      const group = await HttpClient.put(`${SharedController.groupUrl}/${req.body.group.id}`,
                                         { isCountGrow: req.body.isCountGrow });

      if (group) {
        return res.status(200).send(task);
      }

      throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
    }
  }

  /**
   * Gets an array of IGroups and returns it without duplicates.
   * @param arr - The array of groups
   */
  public static toUniqueGroupArray(arr: IGroup[]) {
    if (arr && arr.length < 2) {
      return arr;
    }

    return (arr.filter(
      (currGroup: IGroup, index: any, self: any) =>
        self.findIndex((t: IGroup) => t.id === currGroup.id) === index)
    );
  }
}
