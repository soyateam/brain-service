// shared.statistics.utils

import { TaskManager } from '../task/task.manager';
import { GroupManager } from '../group/group.manager';
import { fromFieldToDisplayName, StatisticsTypes } from './shared.statistics.types';

export class StatisticsUtils {

  /**
   * Get all unique organization groups associated to given task.
   * (Including direct and indirect organization groups associated to indirect sub tasks)
   * @param taskId - The id of the task to get groups from.
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
  public static async getUniqueTaskGroups(taskId: string) {

    // Get the full task object
    const fullTask = await TaskManager.getTaskById(taskId);

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
    const childrenTasks = await TaskManager.getTaskChildren(fullTask._id);

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
      await GroupManager.getManyGroups(Object.keys(associatedGroups))
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
   */
  public static async getSubTasks(taskId: string) {
    return await TaskManager.getTasksByParentId(taskId);
  }

  /**
   * Get all units sum according to all associated groups assigned to some task.
   * @param associategGroups - The associated groups object retrieved
   *                           from getUniqueTaskGroups function.
   * @param statisticsType - The statistics type requested.
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
  public static async getUnitsSum(associatedGroups: { [id: string]: { groupInstanceCount: number, groupDetails: any } }) {
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
    const unitSums = (await GroupManager.getUnitsSums([...unitNames])).units;

    // Attach each unit sum it corresponding details
    for (const currUnitSum of unitSums) {
      unitAssociatedGroups[currUnitSum._id].unitDetails = currUnitSum;
    }

    return unitAssociatedGroups;
  }

  /**
   * Calculate sub tasks statistics of a given task id.
   * @param taskId - The task id to calculate all sub tasks statistics from.
   * @param regularSumType - The regular sum statistics type to calculate.
   */
  public static async calculateSubTasksRegularSum(taskId: string, regularSumType: StatisticsTypes) {
    // Get sub tasks of the tasks
    const subTasks = await StatisticsUtils.getSubTasks(taskId);

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
            name: fromFieldToDisplayName['miluimSum'],
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
            name: fromFieldToDisplayName['hovaSum'],
            data: [],
          },
          {
            name: fromFieldToDisplayName['miluimSum'],
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
          subTasks[index]._id, regularSumType,
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
   */
  public static async calculateSpecificSubTaskRegularSum(
    taskId: string, regularSumType: StatisticsUtils,
  ) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId);
    const associatedGroupsIds = Object.keys(associatedGroups);

    // Explicit statistical values
    const statisticsValues = [];

    switch (regularSumType) {

      case (StatisticsTypes.Sum):

        // Set sum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          // Calculate relative people sum
          const relativePeopleSum = (
            associatedGroups[groupId].groupDetails.peopleSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          statisticsValues[0] += relativePeopleSum;
        }
        break;

      case (StatisticsTypes.ServiceSum):

        // Set hovaSum as 0 for default
        statisticsValues.push(0);

        // Set kevaSum as 0 for default
        statisticsValues.push(0);

        // Set miluimSum as 0 for default
        statisticsValues.push(0);

        // Set civilianSum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

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

          const relativeMiluimSum = (
            associatedGroups[groupId].groupDetails.serviceType.miluimSum *
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
          statisticsValues[2] += relativeMiluimSum;
          statisticsValues[3] += relativeCivilianSum;
        }
        break;

      case (StatisticsTypes.RankSum):

        // Set aSum as 0 for default
        statisticsValues.push(0);

        // Set bSum as 0 for default
        statisticsValues.push(0);

        // Set cSum as 0 for default
        statisticsValues.push(0);

        // Set hovaSum as 0 for default
        statisticsValues.push(0);

        // Set miluimSum as 0 for default
        statisticsValues.push(0);

        // Set civilianSum as 0 for default
        statisticsValues.push(0);

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

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

          const relativeHovaSum = (
            associatedGroups[groupId].groupDetails.rankType.hovaSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          const relativeMiluimSum = (
            associatedGroups[groupId].groupDetails.rankType.miluimSum *
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
          statisticsValues[3] += relativeHovaSum;
          statisticsValues[4] += relativeMiluimSum;
          statisticsValues[5] += relativeCivilianSum;
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
   * @returns Usable object for highcharts package containing categories and series objects.
   */
  public static async calculateRegularSum(taskId: string, regularSumType: StatisticsTypes) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId);
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

          // Calculate relative people sum
          const relativePeopleSum = (
            associatedGroups[groupId].groupDetails.peopleSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
          statisticsObj.series[0].data.push(relativePeopleSum);
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
          name: fromFieldToDisplayName['miluimSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['civilianSum'],
          data: [],
        });

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

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

          const relativeMiluimSum = (
            associatedGroups[groupId].groupDetails.serviceType.miluimSum *
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
          statisticsObj.series[2].data.push(relativeMiluimSum);
          statisticsObj.series[3].data.push(relativeCivilianSum);
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
          name: fromFieldToDisplayName['hovaSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['miluimSum'],
          data: [],
        });

        statisticsObj.series.push({
          name: fromFieldToDisplayName['civilianSum'],
          data: [],
        });

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

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

          const relativeHovaSum = (
            associatedGroups[groupId].groupDetails.rankType.hovaSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          const relativeMiluimSum = (
            associatedGroups[groupId].groupDetails.rankType.miluimSum *
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
          statisticsObj.series[3].data.push(relativeHovaSum);
          statisticsObj.series[4].data.push(relativeMiluimSum);
          statisticsObj.series[5].data.push(relativeCivilianSum);
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
   * @returns Usable object for highcharts package containing categories and series objects.
   */
  public static async calculateUnitSum(taskId: string, unitStatisticsType: StatisticsTypes) {
    // First, get all associated groups on the given task
    const associatedGroups = await StatisticsUtils.getUniqueTaskGroups(taskId);
    const associatedGroupsIds = Object.keys(associatedGroups);

    // Get all units sums of the associated groups
    const unitObj = await StatisticsUtils.getUnitsSum(associatedGroups);
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
            { name: fromFieldToDisplayName['miluimSum'], y: 0 },
            { name: fromFieldToDisplayName['civilianSum'], y: 0 },
          ];

          let unitYValue = 0;
          let hovaSumYValue = 0;
          let kevaSumYValue = 0;
          let miluimSumYValue = 0;
          let civilianSumYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {

            const relativeHovaSum =
              groupObj.groupDetails.serviceType.hovaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount ;
            const relativeKevaSum =
              groupObj.groupDetails.serviceType.kevaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeMiluimSum =
              groupObj.groupDetails.serviceType.miluimSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeCivilianSum =
              groupObj.groupDetails.serviceType.civilianSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;

            unitYValue +=
              relativeHovaSum + relativeKevaSum +
              relativeMiluimSum + relativeCivilianSum;
            hovaSumYValue += relativeHovaSum;
            kevaSumYValue += relativeKevaSum;
            miluimSumYValue += relativeMiluimSum;
            civilianSumYValue += relativeCivilianSum;
          }

          // Setting the service type sums
          drilldownDataTypes[0].y = hovaSumYValue;
          drilldownDataTypes[1].y = kevaSumYValue;
          drilldownDataTypes[2].y = miluimSumYValue;
          drilldownDataTypes[3].y = civilianSumYValue;

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
            { name: fromFieldToDisplayName['hovaSum'], y: 0 },
            { name: fromFieldToDisplayName['miluimSum'], y: 0 },
            { name: fromFieldToDisplayName['civilianSum'], y: 0 },
          ];

          let unitYValue = 0;
          let aSumYValue = 0;
          let bSumYValue = 0;
          let cSumYValue = 0;
          let hovaSumYValue = 0;
          let miluimSumYValue = 0;
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
              groupObj.groupDetails.assignedCount ;
            const relativeHovaSum =
              groupObj.groupDetails.rankType.hovaSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeMiluimSum =
              groupObj.groupDetails.rankType.miluimSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;
            const relativeCivilianSum =
              groupObj.groupDetails.rankType.civilianSum *
              groupObj.groupInstanceCount /
              groupObj.groupDetails.assignedCount;

            unitYValue +=
              relativeASum + relativeBSum + relativeCSum +
              relativeHovaSum + relativeMiluimSum + relativeCivilianSum;
            aSumYValue += relativeASum;
            bSumYValue += relativeBSum;
            cSumYValue += relativeCSum;
            hovaSumYValue += relativeHovaSum;
            miluimSumYValue += relativeMiluimSum;
            civilianSumYValue += relativeCivilianSum;
          }

          // Setting the rank type sums
          drilldownDataTypes[0].y = aSumYValue;
          drilldownDataTypes[1].y = bSumYValue;
          drilldownDataTypes[2].y = cSumYValue;
          drilldownDataTypes[3].y = hovaSumYValue;
          drilldownDataTypes[4].y = miluimSumYValue;
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
