// shared.controller

import { Request, Response } from 'express';
import { HttpClient } from '../utils/http.client';
import config from '../config';
import { InvalidParameter, BadRequest, InternalServerError } from '../utils/error';
import { IGroup } from '../task/task.interface';
import { StatisticsTypes, DateFilterTypes } from './shared.statistics.types';
import { StatisticsController } from './shared.statistics.controller';

export class SharedController {
  private static readonly ERROR_MESSAGES = {
    INVALID_PARAMETER: 'Invalid paramters were given.',
    INVALID_STAT_TYPE: 'Invalid statistics type was given.',
    NO_PARENT: 'Cannot assign to a task without a parent.',
    UNEXISTING_GROUP: 'Cannot find an unexisting group.',
    DUPLICATE_GROUP: 'Cannot assign duplicate groups',
    FAILED_ASSIGN_GROUPS: 'Failed assign groups to task',
  };

  public static readonly groupUrl = `${config.groupServiceUrl}/api/group`;
  private static readonly taskUrl = `${config.taskServiceUrl}/task`;

  /**
   * Assigns a task to a group, and updates the
   * group's assignedCount.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async assignGroup(req: Request, res: Response) {
    // if (!req.body.taskId ||
    //     !req.body.group ||
    //     !req.body.group.id ||
    //     !req.body.group.name ||
    //     !('isCountGrow' in req.body) ||
    //     typeof(req.body.isCountGrow) !== 'boolean') {
    //   throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
    // }
    if (!req.body.taskId ||
      !req.body.kartoffelID ||
      !('isCountGrow' in req.body) ||
      typeof (req.body.isCountGrow) !== 'boolean') {
      throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
    }

    const oldTask = await HttpClient.get(`${SharedController.taskUrl}/${req.body.taskId}`);

    // If the task's parent is null, throw error.
    if (!oldTask.parent) {
      throw new BadRequest(SharedController.ERROR_MESSAGES.NO_PARENT);
    }

    // If the group is need to be deleted
    if (!req.body.isCountGrow) {

      if (oldTask.groups && oldTask.groups.length === 0) {
        throw new BadRequest(SharedController.ERROR_MESSAGES.UNEXISTING_GROUP);
      }

      let filteredGroups = [];

      for (let existsGroup of oldTask.groups) {

      }
    } else { // Group need to be added.

      let filteredGroups = [];
      let filteredGroupsIds = [];
      let currentGroup = await HttpClient.get(`${SharedController.groupUrl}/${req.body.kartoffelID}`);
      let childrenCurrentGroups = await HttpClient.get(`${SharedController.groupUrl}/allChildren/${req.body.kartoffelID}`);
      let ancestorsCurrentGroup = [];

      currentGroup.ancestors.splice(currentGroup.ancestors.length - 1, 1);

      if (currentGroup.ancestors.length > 0) {
        ancestorsCurrentGroup = await HttpClient.post(`${SharedController.groupUrl}`, { ids: currentGroup.ancestors });
      }
      
      // Check if the current group clicked is already exist in task groups.
      let currentGroupFoundIndex = -1;
      for (let index = 0; index < oldTask.groups.length; index += 1) {
        if (oldTask.groups[index].id === currentGroup.kartoffelID) {
          currentGroupFoundIndex = index;
          break;
        }
      }
      
      // If the current group is not found, need to add it.
      if (currentGroupFoundIndex === -1) {
        filteredGroups.push({ name: currentGroup.name, id: currentGroup.kartoffelID, isClicked: true });
        filteredGroupsIds.push(currentGroup.kartoffelID);
      } else {

        // Update the isClicked property of already existing group because it was clicked.
        oldTask.groups[currentGroupFoundIndex].isClicked = true;
      }

      // For each ancestor of the current group, filter only the ones which does not already assigned.
      for (let groupToBeAdded of ancestorsCurrentGroup) {
        let groupFound = false;

        for (let existGroup of oldTask.groups) {
          if (groupToBeAdded.kartoffelID === existGroup.id) {
            groupFound = true;
            break;
          }
        }

        if (!groupFound) {
          filteredGroups.push({ name: groupToBeAdded.name, id: groupToBeAdded.kartoffelID, isClicked: false });
          filteredGroupsIds.push(groupToBeAdded.kartoffelID);
        }
      }

      // For each children of the current group, filter only the ones which does not already assigned.
      for (let groupToBeAdded of childrenCurrentGroups) {

        let groupFound = false;

        for (let existGroup of oldTask.groups) {
          if (groupToBeAdded.kartoffelID === existGroup.id) {
            groupFound = true;
            break;
          }
        }

        if (!groupFound) {
          filteredGroups.push({ name: groupToBeAdded.name, id: groupToBeAdded.kartoffelID, isClicked: false });
          filteredGroupsIds.push(groupToBeAdded.kartoffelID);
        }
      }

      if (filteredGroups.length === 0) {
        return res.status(200).send();
      }

      try {
        await HttpClient.put(`${SharedController.groupUrl}/assign`, { ids: filteredGroupsIds, isCountGrow: req.body.isCountGrow });
      } catch (error) {
        throw new InternalServerError(SharedController.ERROR_MESSAGES.FAILED_ASSIGN_GROUPS);
      }

      oldTask.groups = oldTask.groups.concat(filteredGroups);

      await HttpClient.put(SharedController.taskUrl, { task: oldTask });

      return res.status(200).send();
    }

    // // If the group is need to be deleted.
    // if (!req.body.isCountGrow) {
    //   if (oldTask.groups && oldTask.groups.length === 0) {
    //     throw new BadRequest(SharedController.ERROR_MESSAGES.UNEXISTING_GROUP);
    //   }

    //   let isFound = false;

    //   for (const currIndex in oldTask.groups) {
    //     if (oldTask.groups[currIndex].id === req.body.group.id) {
    //       oldTask.groups.splice(currIndex, 1);
    //       isFound = true;
    //       break;
    //     }
    //   }

    //   if (!isFound) {
    //     throw new BadRequest(SharedController.ERROR_MESSAGES.UNEXISTING_GROUP);
    //   }
    // }

    // const group = await HttpClient.put(`${SharedController.groupUrl}/${req.body.group.id}`,
    //                                    { isCountGrow: req.body.isCountGrow });

    // if (group) {
    //   if (req.body.isCountGrow) {
    //     oldTask.groups.push({ 
    //       id: group.kartoffelID,
    //       name: group.name,
    //       isClicked: req.body.isClicked || false,
    //     });
    //   }

    //   // Remove any duplicates if exist.
    //   const newGroups = SharedController.toUniqueGroupArray(oldTask.groups);
    //   if (JSON.stringify(newGroups) !== JSON.stringify(oldTask.groups)) {
    //     throw new BadRequest(SharedController.ERROR_MESSAGES.DUPLICATE_GROUP);
    //   }
    //   const task = await HttpClient.put(SharedController.taskUrl, { task: oldTask });

    //   if (task) {
    //     return res.status(200).send(task);
    //   }
    // }

    throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Get statistics calculation by given task and statistics types
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getStatistics(req: Request, res: Response) {
    const taskId = req.query.taskId as string;
    const statisticsType = req.query.stats as StatisticsTypes;
    const showSubTasks = req.query.showSubTasks;
    const parentGroupId = req.query.parentGroupId as string | undefined;
    const unitFilter = req.query.unit as string;
    const dateFilter = req.query.date as string;

    // If taskId and statisticsType are given
    if (taskId && statisticsType) {

      // Check if the statistic type given is in legal statisitics types
      if (Object.values(StatisticsTypes).indexOf(statisticsType) !== -1) {

        // Calculate the statistic and return it
        const result = await StatisticsController.calculateStatisticsSum(
          statisticsType, taskId, !!showSubTasks, parentGroupId, unitFilter, dateFilter,
        );
        return res.status(200).send(result);
      }

      throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_STAT_TYPE);
    }

    throw new InvalidParameter(SharedController.ERROR_MESSAGES.INVALID_PARAMETER);
  }

  /**
   * Get view statistics for the main view.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getViewStatistics(req: Request, res: Response) {
    const unitFilter = req.query.unit as string;
    const dateFilter = req.query.date as string;

    const result = await StatisticsController.calculateViewStatistics(unitFilter, dateFilter);

    return res.status(200).send(result);
  }

  /**
   * Get date filters for tasks and groups.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getDateFilters(req: Request, res: Response) {
    const type = req.query.type as DateFilterTypes || DateFilterTypes.Tasks;

    const result = await StatisticsController.getDateFilters(type);

    return res.status(200).send(result);
  }

  /**
   * Get unit filters for group hierarchy tree.
   * @param req - Express Request
   * @param res - Express Response
   */
  public static async getUnitFilters(req: Request, res: Response) {
    const dateFilter = req.query.date as string;

    const result = await StatisticsController.getUnitFilters(dateFilter);

    return res.status(200).send(result);
  }

  /**
   * Gets an array of IGroups and returns it without duplicates.
   * @param arr - The array of groups
   */
  public static toUniqueGroupArray(arr: IGroup[]) {
    if (arr && arr.length < 2) {
      return arr;
    }

    return (arr.filter(
      (currGroup: IGroup, index: any, self: any) =>
        self.findIndex((t: IGroup) => t.id === currGroup.id) === index)
    );
  }
}
