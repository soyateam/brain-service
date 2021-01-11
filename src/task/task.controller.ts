// task.controller

import { Request, Response } from 'express';
import { InvalidParameter, BadRequest, InternalServerError, NotFound } from '../utils/error';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { SharedController } from '../shared/shared.controller';

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
    const tasks = (await HttpClient.get(`${TaskController.tasksUrl}/parent/${req.params.parentId}`))
      .tasks;

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
        req.body.task.groups = SharedController.toUniqueGroupArray(req.body.task.groups);
      }

      const createdTask = await HttpClient.post(TaskController.tasksUrl, { task: req.body.task });

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
    // Get the task from task-service.
    const task = await HttpClient.get(`${TaskController.tasksUrl}/${req.params.id}`);
    let removedSuccessfully = 0;

    // If the task was found.
    if (task) {
      // If it has children, then its not possible to remove the task.
      if (task.subTasksCount > 0) {
        throw new BadRequest(TaskController.ERROR_MESSAGES.BAD_REQUEST);

      } else { // If it doesn't have any children, then remove the task.
        if (task.groups && task.groups.length > 0) {
          let removedGroup;

          for (const currGroup of task.groups) {
            removedGroup = await HttpClient
                .put(`${SharedController.groupUrl}/${currGroup.id}`,
                     { isCountGrow: false });
            if (removedGroup) {
              removedSuccessfully += 1;
            }
          }

          if (removedSuccessfully === task.groups.length) {
            const removedTask = await HttpClient.delete(`${TaskController.tasksUrl}/${req.params.id}`);

            if (removedTask) {
              return res.status(200).send(removedTask);
            }
          }

          throw new InternalServerError('Error in the removal of groups.');
        } else {
          const removedTask =
             await HttpClient.delete(`${TaskController.tasksUrl}/${req.params.id}`);

          if (removedTask) {
            return res.status(200).send(removedTask);
          }

          throw new InternalServerError('Error in the removal of task.');
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
    const task = await HttpClient.get(`${TaskController.tasksUrl}/${req.params.id}${req.query.date ? `?date=${req.query.date}` : ''}`);

    if (task) {
      return res.status(200).send(task);
    }

    throw new NotFound(TaskController.ERROR_MESSAGES.TASK_NOT_FOUND);
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

      const task = await HttpClient.put(TaskController.tasksUrl, { task: req.body.task, clickedGroupId: req.body.clickedGroupId });

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
}
