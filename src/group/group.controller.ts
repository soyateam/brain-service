// group.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { NotFound } from '../utils/error';

export class GroupController {
  private static readonly ERROR_MESSAGES = {
    ORGANIZATION_NOT_FOUND: 'Group was not found.',
  };

  private static readonly groupUrl = `${config.groupServiceUrl}/group`;

  /**
   * Gets a specific organization by the organization id
   * from hierarchy-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getOrganization(req: Request, res: Response) {
    const organization = await HttpClient.get(`${GroupController.groupUrl}/${req.params.id}`);

    if (organization) {
      return res.status(200).send(organization);
    }

    throw new NotFound(GroupController.ERROR_MESSAGES.ORGANIZATION_NOT_FOUND);
  }

    /**
   * Gets a specific organization's children by the organization id
   * from hierarchy-service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getOrganizationChildren(req: Request, res: Response) {
    const organizationChildren = await HttpClient.get(`${GroupController.groupUrl}/${req.params.id}/children`);

    if (organizationChildren) {
      return res.status(200).send(organizationChildren);
    }

    throw new NotFound(GroupController.ERROR_MESSAGES.ORGANIZATION_NOT_FOUND);
  }
}
