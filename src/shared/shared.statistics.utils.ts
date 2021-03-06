// shared.statistics.utils
import moment from 'moment';

import { TaskManager } from '../task/task.manager';
import { GroupManager } from '../group/group.manager';
import {
  fromFieldToDisplayName,
  StatisticsTypes,
  DateFilterTypes,
  majorTasksNameAndId,
  fromMajorTaskIdToDisplayName,
  fromMajorTaskIdToDepthLevel,
} from './shared.statistics.types';

export class StatisticsUtils {

  /**
   * Get all unique organization groups associated to given task.
   * (Including direct and indirect organization groups associated to indirect sub tasks)
   * @param taskId - The id of the task to get groups from.
   * @param dateFilter - Date filter for tasks and groups.
   *
   * @returns
   * Array of objects that each key is the organization group id.
   *
   * The value of each key is object which contains:
   *
   *          groupInstanceCount - Number of times the groups in assigned in the whole hierarchy
   *                               of the current given task.
   *          groupDetails - Full group object received from the group-service.
   */
  public static async getUniqueTaskGroups(taskId: string, dateFilter?: string) {

    // Get the full task object
    const fullTask = await TaskManager.getTaskById(taskId, dateFilter);

    // Object which contains all the associated groups
    const associatedGroups: {
      [id: string]: { groupInstanceCount: number, groupDetails: any },
    } = {};

    // Get all associated groups to the task.
    // For each group id in the groups array add it to the associated groups object
    // with it's associated counts
    for (const currentGroup of fullTask.groups) {
      associatedGroups[currentGroup.id] = { groupInstanceCount: 1, groupDetails: null };
    }

    // Get all direct and indirect children of the task
    const childrenTasks = await TaskManager.getTaskChildren(fullTask._id, dateFilter);

    // For each group, add it to the associated group object
    for (const childTask of childrenTasks) {
      for (const currentGroup of childTask.groups) {
        if (associatedGroups[currentGroup.id]) {
          associatedGroups[currentGroup.id].groupInstanceCount += 1;
        } else {
          associatedGroups[currentGroup.id] = { groupInstanceCount: 1, groupDetails: null };
        }
      }
    }

    // Populate all groups details from group service
    const populatedGroups = (
      await GroupManager.getManyGroups(Object.keys(associatedGroups), dateFilter)
    ).groups;

    // Assign each group it's details
    for (const populatedGroup of populatedGroups) {
      associatedGroups[populatedGroup.kartoffelID].groupDetails = populatedGroup;
    }

    return associatedGroups;
  }

  /**
   * Get sub tasks of a given task.
   * @param taskId - Id of the task to get sub tasks from.
   * @param dateFilter - Date filter for the task.
   */
  public static async getSubTasks(taskId: string, dateFilter?: string) {
    return await TaskManager.getTasksByParentId(taskId, dateFilter);
  }

  /**
   * Get all units sum according to all associated groups assigned to some task.
   * @param associategGroups - The associated groups object retrieved
   *                           from getUniqueTaskGroups function.
   * @param statisticsType - The statistics type requested.
   * @param dateFilter - Date filter for the tasks and groups.
   * 
   * @returns
   *
   * Object which holds:
   *
   * {
   *    [UnitName]: {
   *
   *      unitDetails: The group-service object for unit including all sums.
   *
   *      associatedGroups: Array of groups related to the unit.
   *
   *    }
   * }
   */
  // tslint:disable-next-line: max-line-length
  public static async getUnitsSum(
    associatedGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } },
    dateFilter?: string,
  ) {
    const unitNames = new Set<string>();
    const unitAssociatedGroups: any = {};
    const associatedGroupIds = Object.keys(associatedGroups);

    // Get all unique unit names from all associated groups
    for (const currentGroupId of associatedGroupIds) {
      unitNames.add(associatedGroups[currentGroupId].groupDetails.unitName);

      // Add related group to the related unit
      if (unitAssociatedGroups[associatedGroups[currentGroupId].groupDetails.unitName]) {
        unitAssociatedGroups[associatedGroups[currentGroupId].groupDetails.unitName]
          .associatedGroups.push(associatedGroups[currentGroupId]);

      } else {
        unitAssociatedGroups[associatedGroups[currentGroupId].groupDetails.unitName] =
          { unitDetails: null, associatedGroups: [associatedGroups[currentGroupId]] };
      }
    }

    // Request unit sums from group service
    const unitSums = (await GroupManager.getUnitsSums([...unitNames], dateFilter)).units;

    // Attach each unit sum it corresponding details
    for (const currUnitSum of unitSums) {
      unitAssociatedGroups[currUnitSum._id].unitDetails = currUnitSum;
    }

    return unitAssociatedGroups;
  }

  public static async calculateUnitTasksCount(taskId: string, parentGroupId?: string, dateFilter?: string) {

    let assignedGroups: any = {};
    let assignedGroupsIds: any = [];

    // Ugly quick fix to allow returning empty information
    if (taskId !== 'undefined') {
      assignedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId, dateFilter);
      assignedGroupsIds = Object.keys(assignedGroups);
    }

    const statisticsObj: any = {
      categories: [],
      series: [
        {
          name: fromFieldToDisplayName['unitTaskCount'],
          data: [],
        },
      ],
    };

    for (const currGroupId of assignedGroupsIds) {
      if (assignedGroups[currGroupId].groupDetails.parent === parentGroupId) {
        statisticsObj.categories.push({
          id: assignedGroups[currGroupId].groupDetails.kartoffelID,
          name: assignedGroups[currGroupId].groupDetails.name,
        });
        statisticsObj.series[0].data.push(assignedGroups[currGroupId].groupInstanceCount);
      }
    }

    return statisticsObj;
  }

  /**
   * Calculate view statistics which shows for each task type,
   * it's main tasks and next level tasks.
   * @param unitFilter - Unit filter for the whole tasks statistics.
   * @param dateFilter - Date filter for the whole tasks statistics.
   */
  public static async calculateViewStatistics(unitFilter?: string, dateFilter?: string) {

    // Create statistics obj
    const statisticsObj: any = {
      fullSize: 0,
      mainFullSize: (await GroupManager.getMainGroupsSum(unitFilter, dateFilter)).sum,
    };

    const majorTaskNames = Object.keys(majorTasksNameAndId);
    const majorTasksChildren: any = {};
    const uniqueGroups = {};

    // First, get all children tasks from major tasks and gather all unique groups
    for (const taskName of majorTaskNames) {

      const taskId = (majorTasksNameAndId as any)[taskName];

      const taskWithChildren = await TaskManager.getTaskChildrenByDepthLevel(
        taskId,
        99,
        dateFilter
      );

      majorTasksChildren[taskId] = taskWithChildren;

      StatisticsUtils.appendGroupIdsToUniqueGroups(taskWithChildren.groups, uniqueGroups);
      StatisticsUtils.extractUniqueGroups(taskWithChildren.children, uniqueGroups);

      // tslint:disable-next-line: max-line-length
      statisticsObj[(fromMajorTaskIdToDisplayName as any)[(majorTasksNameAndId as any)[taskName]]] = {
        _id: (majorTasksNameAndId as any)[taskName],
        value: 0,
      };
    }

    // Second, query for all unique groups data from external service
    await StatisticsUtils.gatherAllUniqueGroupsData(uniqueGroups, dateFilter);

    // Now, its time for some calculations
    for (const taskName of majorTaskNames) {

      const taskId = (majorTasksNameAndId as any)[taskName];

      // Calculate in recursive fashion the people sum of each task (direct and indirect children)
      const calculatedTaskObj =
        StatisticsUtils.calculateRecursiveTasksPeopleSum(majorTasksChildren[taskId], uniqueGroups, unitFilter);

      statisticsObj[(fromMajorTaskIdToDisplayName as any)[taskId]] = calculatedTaskObj;
      statisticsObj.fullSize += calculatedTaskObj.value;
    }

    return statisticsObj;
  }

  public static calculateRecursiveTasksPeopleSum(
    taskObj: { name: string, children: any[], value: number, _id: string, ancestors: string[] },
    uniqueGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } },
    unitFilter?: string,
  ) {

    // If it a leaf (task without children) can calculate it people sum directly
    if (taskObj.children.length === 0) {

      return ({
        _id: taskObj._id,
        name: taskObj.name,
        children: [],
        value: StatisticsUtils.calculateDirectPeopleSumOfTask(taskObj, uniqueGroups, unitFilter),
        ancestors: taskObj.ancestors,
      });
    }

    const currentTaskObj: { name: string, children: any[], value: number, _id: string, ancestors: string[] } = {
      name: taskObj.name,
      _id: taskObj._id,
      children: [],
      value: StatisticsUtils.calculateDirectPeopleSumOfTask(taskObj, uniqueGroups, unitFilter),
      ancestors: taskObj.ancestors,
    };

    const currentTaskChildren = [];

    for (let index = 0; index < taskObj.children.length; index += 1) {
      const calculatedChildTask =
        StatisticsUtils.calculateRecursiveTasksPeopleSum(
          taskObj.children[index],
          uniqueGroups,
          unitFilter,
        );

      currentTaskChildren.push(calculatedChildTask);
      currentTaskObj.value += calculatedChildTask?.value;
    }

    currentTaskObj.children = currentTaskChildren;

    return currentTaskObj;
  }

  /**
   * Calculate sum of people sum of all unique groups.
   * @param taksObj - Task object.
   * @param uniqueGroups - Unique groups object.
   * @param unitFilter - Unit filter which will count only the groups in the unit provided.
   */
  public static calculateDirectPeopleSumOfTask(
    taskObj: any,
    uniqueGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } },
    unitFilter?: string,
  ) {

    const groupsObj = taskObj.groups;
    let value = 0;

    if (unitFilter) {

      for (const groupObj of groupsObj) {
        if (uniqueGroups[groupObj.id].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
          groupObj.id === unitFilter) {
          value +=
            (1 / uniqueGroups[groupObj.id].groupDetails.assignedCount) *
            uniqueGroups[groupObj.id].groupDetails.peopleSum;
        }
      }

    } else {

      for (const groupObj of groupsObj) {
        value +=
          (1 / uniqueGroups[groupObj.id].groupDetails.assignedCount) *
          uniqueGroups[groupObj.id].groupDetails.peopleSum;
      }

    }

    return value;
  }

  /**
   * Extract all unique groups from tasks given.
   * @param tasks - Tasks to get all groups from.
   * @param uniqueGroups - Unique groups object already contains unique groups.
   */
  public static extractUniqueGroups(
    tasks: any[], uniqueGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } },
  ) {

    let currentTasks = tasks;
    let nextTasks: any = [];

    while (currentTasks.length > 0) {
      for (const task of currentTasks) {

        StatisticsUtils.appendGroupIdsToUniqueGroups(task.groups, uniqueGroups);

        if (task.children.length !== 0) {
          nextTasks = nextTasks.concat(task.children);
        }
      }

      currentTasks = nextTasks;
      nextTasks = [];
    }
  }

  /**
   * Gather all unique groups ids details by querying the group service.
   * @param uniqueGroups - Unique groups object.
   * @param dateFilter - Date filter for groups.
   */
  public static async gatherAllUniqueGroupsData(
    uniqueGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } },
    dateFilter?: string,
  ) {
    const groupsIds = Object.keys(uniqueGroups);

    const groupsDetails = (await GroupManager.getManyGroups(groupsIds, dateFilter)).groups;

    // Assign each group it's details
    for (const populatedGroup of groupsDetails) {
      uniqueGroups[populatedGroup.kartoffelID].groupDetails = populatedGroup;
    }
  }

  /**
   * Append groups ids to unique groups object.
   * @param groups - Groups to add to unique groups object.
   * @param uniqueGroups - Unique groups object to update.   
   */
  public static appendGroupIdsToUniqueGroups(
    groups: any[],
    uniqueGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } }
  ) {

    for (const groupObj of groups) {
      if (uniqueGroups[groupObj.id]) {
        uniqueGroups[groupObj.id].groupInstanceCount += 1;
      } else {
        uniqueGroups[groupObj.id] = { groupInstanceCount: 1, groupDetails: null };
      }
    }
  }

  /**
   * Get available date filter for given type (tasks/groups)
   * @param type - Date filter type (tasks/groups).
   */
  public static async getDateFilters(type: DateFilterTypes) {

    let dates: string[] = [];

    switch (type) {

      case (DateFilterTypes.Groups):
        dates = await GroupManager.getDateFilters();
        break;

      case (DateFilterTypes.Tasks):
      default:
        dates = await TaskManager.getDateFilters();
        break;
    }

    return dates;
  }

  /**
   * Get all available unit filters.
   * @param dateFilter - Date filter for units groups.
   */
  public static async getUnitFilters(dateFilter?: string) {
    return await GroupManager.getUnits(dateFilter);
  }

  /**
   * Calculate linear statistics of groups sum for a given task.
   * @param taskId - The task id to calculate timeline statistics on.
   */
  public static async calculateTimelineTask(taskId: string) {
    const taskAllDates = (await TaskManager.getTaskByIdAllDates(taskId)).sort((a: any, b: any) => a.date > b.date);

    const statisticsObj = {
      categories: [] as any,
      series: [] as any,
    };

    for (let currTask of taskAllDates) {
      statisticsObj.categories.push(currTask.date);
      statisticsObj.series.push(currTask.sum);
    }

    // First, get all children tasks from major tasks and gather all unique groups
    const currentDate = moment().format('YYYY-MM');
    const uniqueGroups = {};

    const taskWithChildren = await TaskManager.getTaskChildrenByDepthLevel(
      taskId,
      99
    );

    if (taskWithChildren && Object.keys(taskWithChildren).length !== 0) {
      StatisticsUtils.appendGroupIdsToUniqueGroups(taskWithChildren.groups, uniqueGroups);
      StatisticsUtils.extractUniqueGroups(taskWithChildren.children, uniqueGroups);

      await StatisticsUtils.gatherAllUniqueGroupsData(uniqueGroups);

      // Calculate in recursive fashion the people sum of each task (direct and indirect children)
      const calculatedTaskObj =
        StatisticsUtils.calculateRecursiveTasksPeopleSum(taskWithChildren, uniqueGroups);

      statisticsObj.categories.push(currentDate);
      statisticsObj.series.push(calculatedTaskObj.value);
    }

    return statisticsObj;
  }

  /**
   * Calculate sub tasks statistics of a given task id.
   * @param taskId - The task id to calculate all sub tasks statistics from.
   * @param regularSumType - The regular sum statistics type to calculate.
   * @param unitFilter - Unit filter for groups.
   * @param dateFilter - Date filter for tasks.
   */
  public static async calculateSubTasksRegularSum(
    taskId: string, regularSumType: StatisticsTypes, unitFilter?: string, dateFilter?: string
  ) {
    // Get sub tasks of the tasks
    const subTasks = await StatisticsUtils.getSubTasks(taskId, dateFilter);

    // Statistics object for the charts
    const statisticsObj: any = { categories: [], series: [] };

    // Set series types by the statistics types
    switch (regularSumType) {
      case (StatisticsTypes.Sum):
        statisticsObj.series = [
          {
            name: fromFieldToDisplayName['peopleSum'],
            data: [],
          },
        ];

        break;
      case (StatisticsTypes.ServiceSum):
        statisticsObj.series = [
          {
            name: fromFieldToDisplayName['hovaSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['kevaSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['civilianSum'],
            data: [],
          },
        ];
        break;
      case (StatisticsTypes.RankSum):
        statisticsObj.series = [
          {
            name: fromFieldToDisplayName['aSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['bSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['cSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['dSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['hovaSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['civilianSum'],
            data: [],
          },
        ];
        break;
    }

    // For each sub task, calculate the statistics
    for (let index = 0; index < subTasks.length; index += 1) {

      // Calculate statistics values
      const statisticsValues =
        await StatisticsUtils.calculateSpecificSubTaskRegularSum(
          subTasks[index]._id, regularSumType, unitFilter, dateFilter
        );

      // Add the task name as category
      statisticsObj.categories.push({
        name: subTasks[index].name,
        id: subTasks[index]._id,
        drilldown: subTasks[index].subTasksCount !== 0,
      });

      // Add statistics values to the series data
      for (let seriesIndex = 0; seriesIndex < statisticsObj.series.length; seriesIndex += 1) {
        statisticsObj.series[seriesIndex].data.push(statisticsValues[seriesIndex]);
      }
    }

    return statisticsObj;
  }

  /**
   * Calculate regular sum on task as sub task of other task.
   * Returns the statistical values directly (without grouping values for each group as usual).
   * @param taskId - The task id to calculate regular sum on.
   * @param regularSumType - The regular sum type to calculate.
   * @param unitFilter - Unit filter for groups.
   * @param dateFilter - Date filter for tasks.
   */
  public static async calculateSpecificSubTaskRegularSum(
    taskId: string, regularSumType: StatisticsTypes, unitFilter?: string, dateFilter?: string,
  ) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId, dateFilter);
    const associatedGroupsIds = Object.keys(associatedGroups);

    // Explicit statistical values
    const statisticsValues = [];

    switch (regularSumType) {

      case (StatisticsTypes.Sum):

        // Set sum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {

            // Calculate relative people sum
            const relativePeopleSum = (
              associatedGroups[groupId].groupDetails.peopleSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsValues[0] += relativePeopleSum;
          }

        }
        break;

      case (StatisticsTypes.ServiceSum):

        // Set hovaSum as 0 for default
        statisticsValues.push(0);

        // Set kevaSum as 0 for default
        statisticsValues.push(0);

        // Set civilianSum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {
            // Calculate relative service sums
            const relativeHovaSum = (
              associatedGroups[groupId].groupDetails.serviceType.hovaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeKevaSum = (
              associatedGroups[groupId].groupDetails.serviceType.kevaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCivilianSum = (
              associatedGroups[groupId].groupDetails.serviceType.civilianSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsValues[0] += relativeHovaSum;
            statisticsValues[1] += relativeKevaSum;
            statisticsValues[2] += relativeCivilianSum;
          }
        }
        break;

      case (StatisticsTypes.RankSum):

        // Set aSum as 0 for default
        statisticsValues.push(0);

        // Set bSum as 0 for default
        statisticsValues.push(0);

        // Set cSum as 0 for default
        statisticsValues.push(0);

        // Set dSum as 0 for default
        statisticsValues.push(0);

        // Set hovaSum as 0 for default
        statisticsValues.push(0);

        // Set civilianSum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {

            // Calculate relative rank sums
            const relativeASum = (
              associatedGroups[groupId].groupDetails.rankType.aSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeBSum = (
              associatedGroups[groupId].groupDetails.rankType.bSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCSum = (
              associatedGroups[groupId].groupDetails.rankType.cSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeDSum = (
              associatedGroups[groupId].groupDetails.rankType.dSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeHovaSum = (
              associatedGroups[groupId].groupDetails.rankType.hovaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCivilianSum = (
              associatedGroups[groupId].groupDetails.rankType.civilianSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsValues[0] += relativeASum;
            statisticsValues[1] += relativeBSum;
            statisticsValues[2] += relativeCSum;
            statisticsValues[3] += relativeDSum;
            statisticsValues[4] += relativeHovaSum;
            statisticsValues[5] += relativeCivilianSum;
          }
        }
        break;

      // Code will never reach here, if so, throw exception to indicate misuse
      default:
        throw new Error('Misuse of calculateStatistics method - it should get only regular statistics types');

    }

    return statisticsValues;
  }

  /**
   * Calculates statistics object for regular sum types (without units) for a given task.
   * @param taskId - The id of the task to calculate statistics on.
   * @param regularSumType - Regular statistics type (from `StatisticsTypes` Enum).
   * @param unitFilter - Unit filter which will count only the groups in the unit provided.
   * @param dateFilter - Date filter for tasks.
   * 
   * @returns Usable object for highcharts package containing categories and series objects.
   */
  public static async calculateRegularSum(
    taskId: string, regularSumType: StatisticsTypes, unitFilter?: string, dateFilter?: string,
  ) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId, dateFilter);
    const associatedGroupsIds = Object.keys(associatedGroups);

    // Holds the results of the statistics calculation
    // Categories - define the groups names in the tasks in array format
    // Series - define the sum types in the below format:
    //         {
    //           name: Name of the type,
    //           data: Array of the type values connected to the categories order
    //         }
    const statisticsObj: any = { categories: [], series: [] };

    switch (regularSumType) {

      case (StatisticsTypes.Sum):
        statisticsObj.series.push({
          name: fromFieldToDisplayName['peopleSum'],
          data: [],
        });

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {
            // Calculate relative people sum
            const relativePeopleSum = (
              associatedGroups[groupId].groupDetails.peopleSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
            statisticsObj.series[0].data.push(relativePeopleSum);
          }
        }
        break;

      case (StatisticsTypes.ServiceSum):

        // Add series types
        statisticsObj.series.push({
          name: fromFieldToDisplayName['hovaSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['kevaSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['civilianSum'],
          data: [],
        });

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {

            // Calculate relative service sums
            const relativeHovaSum = (
              associatedGroups[groupId].groupDetails.serviceType.hovaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeKevaSum = (
              associatedGroups[groupId].groupDetails.serviceType.kevaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCivilianSum = (
              associatedGroups[groupId].groupDetails.serviceType.civilianSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
            statisticsObj.series[0].data.push(relativeHovaSum);
            statisticsObj.series[1].data.push(relativeKevaSum);
            statisticsObj.series[2].data.push(relativeCivilianSum);
          }
        }
        break;

      case (StatisticsTypes.RankSum):

        // Add series types
        statisticsObj.series.push({
          name: fromFieldToDisplayName['aSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['bSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['cSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['dSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['hovaSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['civilianSum'],
          data: [],
        });

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          if (
            !unitFilter ||
            (
              unitFilter &&
              (
                associatedGroups[groupId].groupDetails.ancestors &&
                associatedGroups[groupId].groupDetails.ancestors.indexOf(unitFilter) !== -1 ||
                groupId === unitFilter
              )
            )
          ) {

            // Calculate relative rank sums
            const relativeASum = (
              associatedGroups[groupId].groupDetails.rankType.aSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeBSum = (
              associatedGroups[groupId].groupDetails.rankType.bSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCSum = (
              associatedGroups[groupId].groupDetails.rankType.cSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeDSum = (
              associatedGroups[groupId].groupDetails.rankType.dSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeHovaSum = (
              associatedGroups[groupId].groupDetails.rankType.hovaSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            const relativeCivilianSum = (
              associatedGroups[groupId].groupDetails.rankType.civilianSum *
              associatedGroups[groupId].groupInstanceCount /
              associatedGroups[groupId].groupDetails.assignedCount
            );

            statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
            statisticsObj.series[0].data.push(relativeASum);
            statisticsObj.series[1].data.push(relativeBSum);
            statisticsObj.series[2].data.push(relativeCSum);
            statisticsObj.series[3].data.push(relativeDSum);
            statisticsObj.series[4].data.push(relativeHovaSum);
            statisticsObj.series[5].data.push(relativeCivilianSum);
          }
        }
        break;

      // Code will never reach here, if so, throw exception to indicate misuse
      default:
        throw new Error('Misuse of calculateStatistics method - it should get only regular statistics types');

    }

    return statisticsObj;
  }

  /**
   * Calculates statistics object for unit statistics sum types for a given task.
   * @param taskId - The id of the task to calculate statistics on.
   * @param unitStatisticsType - Unit statistics type (from `StatisticsTypes` Enum).
   * @param dateFilter - Date filter for tasks and groups.
   * 
   * @returns Usable object for highcharts package containing categories and series objects.
   */
  public static async calculateUnitSum(
    taskId: string, unitStatisticsType: StatisticsTypes, dateFilter?: string,
  ) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId, dateFilter);
    const associatedGroupsIds = Object.keys(associatedGroups);

    // Get all units sums of the associated groups
    const unitObj = await StatisticsUtils.getUnitsSum(associatedGroups, dateFilter);
    const unitNames = Object.keys(unitObj);
    /**
     * Holds the results of the statistics calculation
     * Categories - define the groups names in the tasks in array format
     * Series - define the sum types in the below format:
     *         {
     *           mainSeries: Array of objects like this:
     *           {
     *              name: Name of the unit,
     *              y: Sum of the People in the unit that are in the task,
     *              fullSize: Full size of the unit (To indicate the portion y takes),
     *              drilldown: Name of the unit (used as drilldown id)
     *
     *           },
     *           drilldownSeries: Array of the objects like this:
     *           {
     *              name: Name of the unit,
     *              id: Name of the unit (the drilldown parameter as mentioned above)
     *              data: Array of objects like this:
     *              {
     *                name: Groups Names / Service Types / Rank Types,
     *                y: The respective sum,
     *              },
     *           },
     *
     *         }
     */
    const statisticsObj: any = { mainSeries: [], drilldownSeries: [] };

    switch (unitStatisticsType) {

      case (StatisticsTypes.UnitSum):

        // For each unit name create unit data object for main series and drilldown object
        for (const unitName of unitNames) {
          const unitDataObj = {
            name: unitName,
            y: 0,
            fullSize: unitObj[unitName].unitDetails.peopleSum,
            drilldown: unitName,
          };
          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          let unitYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {
            const relativePeopleSum =
              groupObj.groupDetails.peopleSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;

            unitYValue += relativePeopleSum;

            unitDrilldownObj.data.push({
              name: groupObj.groupDetails.name,
              y: relativePeopleSum,
            });
          }

          // Setting the accumulate value of the associated groups
          unitDataObj.y = unitYValue;

          // Setting the main series object and drilldown object
          statisticsObj.mainSeries.push(unitDataObj);
          statisticsObj.drilldownSeries.push(unitDrilldownObj);
        }

        break;

      case (StatisticsTypes.UnitServiceSum):

        // For each unit name create unit data object for main series and drilldown object
        for (const unitName of unitNames) {

          const unitDataObj = {
            name: unitName,
            y: 0,
            fullSize: unitObj[unitName].unitDetails.peopleSum,
            drilldown: unitName,
          };

          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          const drilldownDataTypes = [
            { name: fromFieldToDisplayName['hovaSum'], y: 0 },
            { name: fromFieldToDisplayName['kevaSum'], y: 0 },
            { name: fromFieldToDisplayName['civilianSum'], y: 0 },
          ];

          let unitYValue = 0;
          let hovaSumYValue = 0;
          let kevaSumYValue = 0;
          let civilianSumYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {

            const relativeHovaSum =
              groupObj.groupDetails.serviceType.hovaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeKevaSum =
              groupObj.groupDetails.serviceType.kevaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeCivilianSum =
              groupObj.groupDetails.serviceType.civilianSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;

            unitYValue +=
              relativeHovaSum + relativeKevaSum + relativeCivilianSum;
            hovaSumYValue += relativeHovaSum;
            kevaSumYValue += relativeKevaSum;
            civilianSumYValue += relativeCivilianSum;
          }

          // Setting the service type sums
          drilldownDataTypes[0].y = hovaSumYValue;
          drilldownDataTypes[1].y = kevaSumYValue;
          drilldownDataTypes[2].y = civilianSumYValue;

          // Setting the data of the drilldown to the service type sums
          unitDrilldownObj.data = drilldownDataTypes;

          // Setting the accumulate value of the associated groups
          unitDataObj.y = unitYValue;

          // Setting the main series object and drilldown object
          statisticsObj.mainSeries.push(unitDataObj);
          statisticsObj.drilldownSeries.push(unitDrilldownObj);
        }

        break;

      case (StatisticsTypes.UnitRankSum):

        // For each unit name create unit data object for main series and drilldown object
        for (const unitName of unitNames) {
          const unitDataObj = {
            name: unitName,
            y: 0,
            fullSize: unitObj[unitName].unitDetails.peopleSum,
            drilldown: unitName,
          };
          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          const drilldownDataTypes = [
            { name: fromFieldToDisplayName['aSum'], y: 0 },
            { name: fromFieldToDisplayName['bSum'], y: 0 },
            { name: fromFieldToDisplayName['cSum'], y: 0 },
            { name: fromFieldToDisplayName['dSum'], y: 0 },
            { name: fromFieldToDisplayName['hovaSum'], y: 0 },
            { name: fromFieldToDisplayName['civilianSum'], y: 0 },
          ];

          let unitYValue = 0;
          let aSumYValue = 0;
          let bSumYValue = 0;
          let cSumYValue = 0;
          let dSumYValue = 0;
          let hovaSumYValue = 0;
          let civilianSumYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {

            const relativeASum =
              groupObj.groupDetails.rankType.aSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeBSum =
              groupObj.groupDetails.rankType.bSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeCSum =
              groupObj.groupDetails.rankType.cSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeDSum =
              groupObj.groupDetails.rankType.dSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeHovaSum =
              groupObj.groupDetails.rankType.hovaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeCivilianSum =
              groupObj.groupDetails.rankType.civilianSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;

            unitYValue +=
              relativeASum + relativeBSum + relativeCSum +
              relativeDSum + relativeHovaSum + relativeCivilianSum;
            aSumYValue += relativeASum;
            bSumYValue += relativeBSum;
            cSumYValue += relativeCSum;
            dSumYValue += relativeDSum;
            hovaSumYValue += relativeHovaSum;
            civilianSumYValue += relativeCivilianSum;
          }

          // Setting the rank type sums
          drilldownDataTypes[0].y = aSumYValue;
          drilldownDataTypes[1].y = bSumYValue;
          drilldownDataTypes[2].y = cSumYValue;
          drilldownDataTypes[3].y = dSumYValue;
          drilldownDataTypes[4].y = hovaSumYValue;
          drilldownDataTypes[5].y = civilianSumYValue;

          // Setting the data of the drilldown to the rank type sums
          unitDrilldownObj.data = drilldownDataTypes;

          // Setting the accumulate value of the associated groups
          unitDataObj.y = unitYValue;

          // Setting the main series object and drilldown object
          statisticsObj.mainSeries.push(unitDataObj);
          statisticsObj.drilldownSeries.push(unitDrilldownObj);
        }
        break;

      // Code will never reach here, if so, throw exception to indicate misuse
      default:
        throw new Error('Misuse of calculateStatistics method - it should get only regular statistics types');
    }

    return statisticsObj;
  }

}
