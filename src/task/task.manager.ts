// task.manager

import { HttpClient } from '../utils/http.client';
import config from '../config';

export class TaskManager {

  private static readonly tasksUrl = `${config.taskServiceUrl}/task`;

  /**
   * Gets all children tasks of a given task by its id.
   * @param parentId - The id of the parent task.
   */
  public static async getTasksByParentId(parentId: string) {
    return (await HttpClient.get(`${TaskManager.tasksUrl}/parent/${parentId}`)).tasks;
  }

  /**
   * Gets a task by Id.
   * @param taskId - The id of the task.
   */
  public static async getTaskById(taskId: string) {
    return await HttpClient.get(`${TaskManager.tasksUrl}/${taskId}`);
  }

  /**
   * Get direct and indirect children of a given task.
   * @param taskId - The id of the task.
   */
  public static async getTaskChildren(taskId: string) {
    return await HttpClient.get(`${TaskManager.tasksUrl}/${taskId}/children`);
  }

}
