// task.controller

import { Request, Response } from 'express';
import { InvalidParameter, BadRequest } from '../utils/error';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { IGroup } from './task.interface';

export class TaskController {
  private static readonly ERROR_MESSAGES = {
    TASK_NOT_FOUND: 'Task was not found.',
    INVALID_PARAMETER: 'Invalid paramter was given.',
    BAD_REQUEST: 'Cannot remove task with children.',
  };
  private static readonly tasksUrl = `${config.taskServiceUrl}/task`;

  /**
   * Gets all the tasks of a given parentId.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTasksByParentId(req: Request, res: Response) {
    const tasks =
      (await HttpClient.get(`${TaskController.tasksUrl}/parent/${req.params.parentId}`)).tasks;

    if (tasks) {
      return res.status(200).send({ tasks });
    }

    throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  public static async getTasksByParentAndType(req: Request, res: Response) {
    const tasks =
      (await HttpClient.get(`${TaskController.tasksUrl}/parent/${req.params.parentId}/type/${req.params.type}`)).tasks;

    if (tasks) {
      return res.status(200).send({ tasks });
    }

    throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Creates a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async createTask(req: Request, res: Response) {
    if (!req.body.task) {
      throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
    } else {
      if (req.body.task.groups) {
        req.body.task.groups = TaskController.toUniqueGroupArray(req.body.task.groups);
      }

      const createdTask = await HttpClient.post(TaskController.tasksUrl,
                                                { task: req.body.task });

      if (createdTask) {
        return res.status(200).send(createdTask);
      }

      throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
    }
  }

  /**
   * Deletes a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async deleteTask(req: Request, res: Response) {
    // Get the children of a task to know if it has any.
    const childTasks = (await HttpClient.get(`${TaskController.tasksUrl}/parent/${req.params.id || 'null'}`)).tasks;

    // Checks if there are any children to this task
    if (childTasks) {
      // If it has children, then its not possible to remove the task.
      if (childTasks.length > 0) {
        throw new BadRequest(TaskController.ERROR_MESSAGES.BAD_REQUEST);
      } else { // If it doesn't have any children, then remove the task.
        const removedTask = await HttpClient.delete(`${TaskController.tasksUrl}/${req.params.id}`);

        if (removedTask) {
          return res.status(200).send(removedTask);
        }

      }
    }
    throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Gets a task by Id.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTaskById(req: Request, res: Response) {
    const task = await HttpClient.get(`${TaskController.tasksUrl}/${req.params.id}`);

    if (task) {
      return res.status(200).send(task);
    }

    throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Updates a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async updateTask(req: Request, res: Response) {
    if (!req.body.task) {
      throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
    } else {
      if (req.body.task.groups) {
        delete req.body.task.groups;
      }

      const task = await HttpClient.put(TaskController.tasksUrl, { task: req.body.task });

      if (task) {
        return res.status(200).send(task);
      }

      throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
    }
  }

  /**
   * Gets tasks by type.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTasksByType(req: Request, res: Response) {
    const tasks = await HttpClient.get(`${TaskController.tasksUrl}/type/${req.params.type}`);

    if (tasks) {
      return res.status(200).send(tasks);
    }

    throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  private static toUniqueGroupArray(arr: IGroup[]) {
    if (arr.length < 2) {
      return arr;
    }

    return (arr.filter(
      (currGroup: IGroup, index: any, self: any) =>
        self.findIndex((t: IGroup) => (t.id === currGroup.id) === index),
    ));
  }
}
