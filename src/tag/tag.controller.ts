// tag.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { NotFound, InvalidParameter } from '../utils/error';

export class TagController {
  private static readonly ERROR_MESSAGES = {
    TAG_NOT_FOUND: 'Tag was not found.',
    INVALID_PARAMETER: 'Invalid paramter was given.',
  };
  private static readonly tagsUrl = `${config.taskServiceUrl}/tags`;

  /**
   * Gets all the tags from the task service.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTags(req: Request, res: Response) {
    const tags = await HttpClient.get(`${this.tagsUrl}/tags`);

    if (tags) {
      return res.status(200).send(tags);
    }

    throw new NotFound(this.ERROR_MESSAGES.TAG_NOT_FOUND);
  }

  /**
   * Gets a specific tag by a specified tag id.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTagById(req: Request, res: Response) {
    const tag = await HttpClient.get(`${this.tagsUrl}/${req.params.id}`);

    if (tag) {
      return res.status(200).send({ tag });
    }

    throw new NotFound(this.ERROR_MESSAGES.TAG_NOT_FOUND);
  }

  /**
   * Adds a new tag.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async addTag(req: Request, res: Response) {
    const addedTag = await HttpClient.post(`${this.tagsUrl}`, { tag: req.body.tag });

    if (addedTag) {
      return res.status(200).send(addedTag);
    }

    throw new InvalidParameter(this.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Deletes a tag by its id.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async deleteTag(req: Request, res: Response) {
    const deletedTag = await HttpClient.delete(`${this.tagsUrl}/${req.params.id}`);

    if (deletedTag) {
      return res.status(200).send(deletedTag);
    }
  }
}
