// shared.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { InvalidParameter } from '../utils/error';

export class SharedController {
  private static readonly ERROR_MESSAGES = {
    INVALID_PARAMETER: 'Invalid paramter was given.',
  };

  private static readonly groupUrl = `${config.groupServiceUrl}/group`;
  private static readonly taskUrl = `${config.taskServiceUrl}/task`;

  /**
   * Assigns a task to a group, and updates the
   * group's assignedCount.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async assignGroup(req: Request, res: Response) {
    const task = await HttpClient.put(SharedController.taskUrl, { task: req.body.task });

    if (task) {
      const group = await HttpClient.put(SharedController.groupUrl,
                                         { isCountGrow: true, id: req.body.groupId });

      if (group) {
        res.status(200).send(task);
      }
    }

    throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
  }
}
