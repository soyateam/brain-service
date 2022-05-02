// task.repository.ts

import { Types } from 'mongoose';

import { TaskType, ITask, collectionName } from './task.interface';
// tslint:disable-next-line: import-name
import TaskUtils from './task.utils';
import taskModel from './task.model';
// tslint:disable-next-line: import-name
import DateDumpModel from '../utils/dateDumpModel';

export class TaskRepository {

  private static populationFields = 'subTasksCount';
  private static MAX_DATE_LIMIT = 12;

  public static getModelByDate(dateFilter: string) {
    return DateDumpModel.getModelByDate(taskModel, dateFilter);
  }

  /**
   * Get task id from all dates available.
   * @param taskId - The id of the task
   */
  public static async getByIdAllDates(taskId: string) {
    const results = [];
    const dates = (await TaskRepository.getDateFilters());
    dates.sort((a: any, b: any) => (a < b) ? -1 : (a > b) ? 1 : 0);
    const minLength = Math.min(dates.length, TaskRepository.MAX_DATE_LIMIT);

    for (let index = 0; index < minLength; index += 1) {
      let taskDate: any = (await TaskRepository.getById(taskId, dates[index]));
      if (taskDate) {
        taskDate = taskDate.toJSON();
        results.push({ date: dates[index], ...taskDate });
      }
    }

    return results;
  }

  /**
   * Get task by id.
   * @param taskId - The id of the task
   */
  public static getById(taskId: string, dateFilter?: string) {

    if (dateFilter) {
      return TaskRepository.getModelByDate(dateFilter)
        .findOne({ _id: taskId })
        .populate(TaskRepository.populationFields)
        .exec();
    }

    return taskModel
      .findOne({ _id: taskId })
      .populate(TaskRepository.populationFields)
      .exec();
  }

  /**
   * Get all tasks.
   */
  public static getAll(dateFilter?: string): any {

    if (dateFilter) {
      return TaskRepository.getModelByDate(dateFilter)
        .find()
        .populate(TaskRepository.populationFields)
        .exec();
    }

    return taskModel
      .find()
      .populate(TaskRepository.populationFields)
      .exec();
  }

  /**
   * Create a document model by his properties.
   * @param modelProperties - Properties of the model.
   */
  public static create(modelProperties: any) {
    return taskModel.create({ ...modelProperties });
  }

  /**
   * Delete task by id.
   * @param taskId - The id of the task
   */
  public static deleteById(taskId: string): any {
    return taskModel.findByIdAndDelete({ _id: taskId });
  }

  /** Task Repository Self Implemented Methods **/

  /**
   * Get tasks by parent task id.
   * @param parentId - ObjectID of the parent task.
   */
  public static getByParentId(parentId: string, dateFilter?: string) {

    if (dateFilter) {
      return TaskRepository.getModelByDate(dateFilter)
        .find({ parent: parentId === 'null' ? null : parentId })
        .populate('subTasksCount')
        .exec();
    }

    return taskModel
      .find({ parent: parentId === 'null' ? null : parentId })
      .populate('subTasksCount')
      .exec();
  }

  /**
   * Update task by given properites.
   * @param taskProperties - Task properites to update
   */
  public static update(taskProperties: Partial<ITask>) {

    // For now only updates the groups/name/description values
    const sanitizedProperties = {
      ...(taskProperties.groups ? { groups: taskProperties.groups } : {}),
      ...(taskProperties.name ? { name: taskProperties.name } : {}),
      ...(taskProperties.description ? { description: taskProperties.description } : {}),
    };

    return taskModel.findOneAndUpdate(
      { _id: taskProperties._id },
      { $set: sanitizedProperties },
      { new: true },
    ).populate(TaskRepository.populationFields)
      .exec();
  }

  /**
   * Get root parents by task type
   * @param type - Task type.
   */
  public static getRootsByType(type: TaskType, dateFilter?: string) {

    if (dateFilter) {
      return TaskRepository.getModelByDate(dateFilter)
        .find({ type, parent: null })
        .populate(TaskRepository.populationFields)
        .exec();
    }
    return taskModel
      .find({ type, parent: null })
      .populate(TaskRepository.populationFields)
      .exec();
  }

  /**
   * Get all children for a given task by id (direct and indirect children)
   * @param taskId - The id of the task parent.
   */
  public static async getChildren(
    taskId: string, depthLevel?: number, dateFilter?: string,
  ) {
    const currentModel = dateFilter ? TaskRepository.getModelByDate(dateFilter) : taskModel;

    if (depthLevel) {
      const taskWithChildren = await currentModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(taskId),
          },
        },
        {
          $graphLookup: {
            from: currentModel.collection.collectionName,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent',
            as: 'children',
            maxDepth: depthLevel - 1,
            depthField: 'depth',
          },
        },
      ]);

      return TaskUtils.createTree(taskWithChildren[0]);
    }

    return (
      await currentModel
        .find({ ancestors: taskId })
        .populate(TaskRepository.populationFields)
        .exec()
    );
  }

  /**
   * Get available date filters for tasks.
   */
  static async getDateFilters() {
    return await DateDumpModel.getAllDates(`${collectionName.toLowerCase()}s`);
  }
}
