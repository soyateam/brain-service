// task.controller

import { Request, Response } from 'express';
import { InvalidParameter, BadRequest, InternalServerError, NotFound } from '../utils/error';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { SharedController } from '../shared/shared.controller';
import { TaskRepository } from './task.repository';
import { GroupRepository } from '../group/group.repository';
import { ITask } from './task.interface';

export class TaskController {
  private static readonly ERROR_MESSAGES = {
    TASK_NOT_FOUND: 'Task was not found.',
    INVALID_PARAMETER: 'Invalid paramter was given.',
    BAD_REQUEST: 'Cannot remove task with children.',
  };

  /** @deprecated */
  private static readonly tasksUrl = `${config.taskServiceUrl}/task`;


  /**
   * Gets all the tasks of a given parentId.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getTasksByParentId(req: Request, res: Response) {
    const parentId = req.params.parentId;
    const dateFilter = req.params.dateFilter as string;

    const tasks = await TaskRepository.getByParentId(parentId, dateFilter);

    /** @deprecated */
    // const tasks = (await HttpClient.get(`${TaskController.tasksUrl}/parent/${req.params.parentId}`))
    //   .tasks;

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
    const taskProperties = req.body.task;

    if (!taskProperties) {
      throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
    } else {
      if (taskProperties.groups) {
        taskProperties.groups = SharedController.toUniqueGroupArray(taskProperties.groups);
      }

      // If it sub task
      if (taskProperties.parent) {
        // Find the parent task
        const parentTask = (await TaskRepository.getById(taskProperties.parent)) as ITask;

        if (parentTask) {
          // Attach the ancestors from the parent task to the ancestors of the sub task
          taskProperties.ancestors = [parentTask._id, ...parentTask.ancestors];

          // Force type of the task to be as the parent's type
          taskProperties.type = parentTask.type;

          // Create the task
          const createdTask = await TaskRepository.create(taskProperties);

          if (createdTask) {
            return res.status(200).send(createdTask);    
          }
        }

        // If the task parent value is invalid, throw an error
        throw new InvalidParameter(TaskController.ERROR_MESSAGES.INVALID_PARAMETER);
      }

      // Root task case
      return await TaskRepository.create(taskProperties);
    }
  }

  /**
   * Deletes a task.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async deleteTask(req: Request, res: Response) {
    // Get the task from task-service.
    const task = (await TaskRepository.getById(req.params.id)) as ITask;
    let removedSuccessfully = 0;

    // If the task was found.
    if (task) {
      // If it has children, then its not possible to remove the task.
      if (task.subTasksCount && task.subTasksCount > 0) {
        throw new BadRequest(TaskController.ERROR_MESSAGES.BAD_REQUEST);

      } else { // If it doesn't have any children, then remove the task.
        if (task.groups && task.groups.length > 0) {
          let removedGroup;

          for (const currGroup of task.groups) {
            removedGroup = (await GroupRepository.updateById(currGroup.id, -1));
            if (removedGroup) {
              removedSuccessfully += 1;
            }
          }

          if (removedSuccessfully === task.groups.length) {
            const removedTask = await TaskRepository.deleteById(req.params.id);

            if (removedTask) {
              return res.status(200).send(removedTask);
            }
          }

          throw new InternalServerError('Error in the removal of groups.');
        } else {
          const removedTask = (await TaskRepository.deleteById(req.params.id)) as ITask;

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
    const taskId = req.params.id;
    const dateFilter = req.query.date as string;

    const task = await TaskRepository.getById(taskId, dateFilter);

    /** @deprecated */
    // const task = await HttpClient.get(`${TaskController.tasksUrl}/${req.params.id}${req.query.date ? `?date=${req.query.date}` : ''}`);

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
