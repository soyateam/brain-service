// task.manager

import { HttpClient } from '../utils/http.client';
import config from '../config';

export class TaskManager {

  private static readonly tasksUrl = `${config.taskServiceUrl}/task`;

  /**
   * Gets all children tasks of a given task by its id.
   * @param parentId - The id of the parent task.
   * @param dateFilter - Date filter of the task.
   */
  public static async getTasksByParentId(parentId: string, dateFilter?: string) {
    return (await HttpClient.get(`${TaskManager.tasksUrl}/parent/${parentId}${dateFilter ? `?date=${dateFilter}`: ''}`)).tasks;
  }

  /**
   * Gets a task by Id.
   * @param taskId - The id of the task.
   * @param dateFilter - Date filter of the task.
   */
  public static async getTaskById(taskId: string, dateFilter?: string) {
    return await HttpClient.get(`${TaskManager.tasksUrl}/${taskId}${dateFilter ? `?date=${dateFilter}`: ''}`);
  }

  /**
   * Get direct and indirect children of a given task.
   * @param taskId - The id of the task.
   * @param dateFilter - Date filter of the task.
   */
  public static async getTaskChildren(taskId: string, dateFilter?: string) {
    return await HttpClient.get(`${TaskManager.tasksUrl}/${taskId}/children${dateFilter ? `?date=${dateFilter}`: ''}`);
  }

  public static async getTaskChildrenByDepthLevel(taskId: string, depthLevel: number, dateFilter?: string) {
    return await HttpClient.get(`${TaskManager.tasksUrl}/${taskId}/children/depth/${depthLevel}${dateFilter ? `?date=${dateFilter}`: ''}`);
  }

}
