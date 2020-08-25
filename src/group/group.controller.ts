// group.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { NotFound } from '../utils/error';

export class GroupController {
  private static readonly ERROR_MESSAGES = {
    INVALID_PARAMETER: 'Invalid parameter was given.',
  };

  private static readonly groupUrl = `${config.groupServiceUrl}/api/group`;

  /**
   * Gets groups by the groups parent id
   * from group-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getGroupsByParent(req: Request, res: Response) {
    const groups =
      (await HttpClient.get(`${GroupController.groupUrl}/children/${req.params.id || ''}`));

    if (groups) {
      return res.status(200).send(groups);
    }

    throw new NotFound(GroupController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Gets a specific group's children by the organization id
   * from group-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getGroupById(req: Request, res: Response) {
    const groups = await HttpClient.get(`${GroupController.groupUrl}/${req.params.id}`);

    if (groups) {
      return res.status(200).send(groups);
    }

    throw new NotFound(GroupController.ERROR_MESSAGES.INVALID_PARAMETER);
  }
}
