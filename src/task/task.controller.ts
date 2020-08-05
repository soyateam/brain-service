// task.controller

import { Request, Response } from 'express';
import { NotFound, InvalidParameter } from '../utils/error';
import { HttpClient } from '../utils/http.client';
import config from '../config';

export class TaskController {
  private static readonly ERROR_MESSAGES = {
    TASK_NOT_FOUND: 'Task was not found.',
    INVALID_PARAMETER: 'Invalid paramter was given.',
  };
  private static readonly tasksUrl = `${config.taskServiceUrl}/tasks`;

  /**
   * Gets all the tasks of a given parentId.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTasksByParentId(req: Request, res: Response) {
    const tasks = await HttpClient.get(`${this.tasksUrl}/parent/${req.params.parentId}`);

    if (tasks) {
      return res.status(200).send({ tasks });
    }

    throw new NotFound(this.ERROR_MESSAGES.TASK_NOT_FOUND);
  }

  /**
   * Gets specified statistics of a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getStats(req: Request, res: Response) {
    // Implement stats here.
  }

  /**
   * Creates a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async createTask(req: Request, res: Response) {
    const createdTask = await HttpClient.post(`${this.tasksUrl}`, { task: req.body.task });

    if (createdTask) {
      return res.status(200).send(createdTask);
    }

    throw new InvalidParameter(this.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Deletes a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async deleteTask(req: Request, res: Response) {
    const removedTask = await HttpClient.delete(`${this.tasksUrl}/${req.params.id}`);

    if (removedTask) {
      return res.status(200).send(removedTask);
    }

    throw new NotFound(this.ERROR_MESSAGES.TASK_NOT_FOUND);
  }

  /**
   * Gets a task by Id.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTaskById(req: Request, res: Response) {
    const task = await HttpClient.get(`${this.tasksUrl}/${req.params.id}`);

    if (task) {
      return res.status(200).send(task);
    }

    throw new NotFound(this.ERROR_MESSAGES.TASK_NOT_FOUND);
  }
}
