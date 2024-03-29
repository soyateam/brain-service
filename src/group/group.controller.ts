// group.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { NotFound } from '../utils/error';
import { IGroup } from './group.interface';
import { GroupRepository } from './group.repository';

export class GroupController {
  private static readonly ERROR_MESSAGES = {
    INVALID_PARAMETER: 'Invalid parameter was given.',
  };

  private static readonly groupUrl = `${config.groupServiceUrl}/api/group`;

  /**
   * Gets all children groups by their parent group id
   * from group-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getAllChildrenByParent(req: Request, res: Response) {
    const groupId = req.params.id ? req.params.id : config.RootGroupAncestorId;
    const dateFilter = req.query.date as string;

    const groups = await GroupRepository.getAllChildrenByParentId(groupId, dateFilter);

    /** @deprecated */
    // const groups =
    //   (await HttpClient.get(`${GroupController.groupUrl}/allChildren/${req.params.id || ''}`));

    if (groups) {
      return res.status(200).send(groups);
    }
  }

  /**
   * Gets groups by the groups parent id
   * from group-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getGroupsByParent(req: Request, res: Response) {
    const groupId = req.params.id ? req.params.id : config.RootGroupAncestorId;
    const dateFilter = req.query.date as string;

    const groups = await GroupRepository.getChildrenByParentId(groupId, dateFilter) as IGroup;

    /** @deprecated */
    // const groups =
    //   (await HttpClient.get(`${GroupController.groupUrl}/children/${req.params.id || ''}`));

    if (groups) {
      return res.status(200).send(groups.childrenPopulated);
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
    const groupId = req.params.id;
    const dateFilter = req.query.date as string;

    const groups = await GroupRepository.getById(groupId, dateFilter);

    /** @deprecated */
    // const groups = await HttpClient.get(`${GroupController.groupUrl}/${req.params.id}`);

    if (groups) {
      return res.status(200).send(groups);
    }

    throw new NotFound(GroupController.ERROR_MESSAGES.INVALID_PARAMETER);
  }
}
