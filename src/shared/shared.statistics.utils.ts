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
    for (const taskGroups of fullTask.groups) {
      for (const currentGroup of taskGroups) {
        associatedGroups[currentGroup.id] = { groupInstanceCount: 1, groupDetails: null };
      }
    }

    // Get all direct and indirect children of the task
    const childrenTasks = await TaskManager.getTaskChildren(fullTask._id);

    // For each group, add it to the associated group object
    for (const childTask of childrenTasks) {
      for (const childGroups of childTask.groups) {
        for (const currentGroup of childGroups) {
          if (associatedGroups[currentGroup.id]) {
            associatedGroups[currentGroup.id].groupInstanceCount += 1;
          } else {
            associatedGroups[currentGroup.id] = { groupInstanceCount: 1, groupDetails: null };
          }
        }
      }
    }

    // Populate all groups details from group service
    const populatedGroups = await GroupManager.getManyGroups(Object.keys(associatedGroups));

    // Assign each group it's details
    for (const populatedGroup of populatedGroups) {
      associatedGroups[populatedGroup.kartoffelID].groupDetails = populatedGroups;
    }

    return associatedGroups;
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
        .associatedGroups.push(associatedGroups[currentGroupId].groupDetails);

      } else {
        unitAssociatedGroups[associatedGroups[currentGroupId].groupDetails.unitName] =
          { unitDetails: null, associatedGroups: [] };
      }
    }

    // Request unit sums from group service
    const unitSums = await GroupManager.getUnitsSums([...unitNames]);

    // Attach each unit sum it corresponding details
    for (const currUnitSum of unitSums) {
      unitAssociatedGroups[currUnitSum.unitName].unitDetails = currUnitSum;
    }

    return unitAssociatedGroups;
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

          statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
          statisticsObj.series[0].data.push(relativeHovaSum);
          statisticsObj.series[1].data.push(relativeKevaSum);
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

        // For each group, add it to the categories and set it corresponding sum to the series
        for (const groupId of associatedGroupsIds) {

          // Calculate relative rank sums
          const relativeASum = (
            associatedGroups[groupId].groupDetails.rankType.aSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          const relativeBSum = (
            associatedGroups[groupId].groupDetails.serviceType.bSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          const relativeCSum = (
            associatedGroups[groupId].groupDetails.serviceType.cSum *
            associatedGroups[groupId].groupInstanceCount /
            associatedGroups[groupId].groupDetails.assignedCount
          );

          statisticsObj.categories.push(associatedGroups[groupId].groupDetails.name);
          statisticsObj.series[0].data.push(relativeASum);
          statisticsObj.series[1].data.push(relativeBSum);
          statisticsObj.series[2].data.push(relativeCSum);
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
            fullSize: unitObj.peopleSum,
            drilldown: unitName,
          };
          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          let unitYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {
            unitYValue += groupObj.peopleSum;
            unitDrilldownObj.data.push({
              name: groupObj.name,
              y: groupObj.peopleSum,
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
            fullSize: unitObj.peopleSum,
            drilldown: unitName,
          };
          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          const drilldownDataTypes = [
            { name: fromFieldToDisplayName['hovaSum'], y: 0 },
            { name: fromFieldToDisplayName['kevaSum'], y: 0 },
          ];

          let unitYValue = 0;
          let hovaSumYValue = 0;
          let kevaSumYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {
            unitYValue += groupObj.serviceType.hovaSum + groupObj.serviceType.kevaSum;
            hovaSumYValue += groupObj.serviceType.hovaSum;
            kevaSumYValue += groupObj.serviceType.kevaSum;
          }

          // Setting the service type sums
          drilldownDataTypes[0].y = hovaSumYValue;
          drilldownDataTypes[1].y = kevaSumYValue;

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
            fullSize: unitObj.peopleSum,
            drilldown: unitName,
          };
          const unitAssociatedGroups = unitObj[unitName].associatedGroups;
          const unitDrilldownObj: any = { name: unitName, id: unitDataObj.drilldown, data: [] };
          const drilldownDataTypes = [
            { name: fromFieldToDisplayName['aSum'], y: 0 },
            { name: fromFieldToDisplayName['bSum'], y: 0 },
            { name: fromFieldToDisplayName['cSum'], y: 0 },
          ];

          let unitYValue = 0;
          let aSumYValue = 0;
          let bSumYValue = 0;
          let cSumYValue = 0;

          // Add drilldown data for each unit as the groups associated to the unit
          for (const groupObj of unitAssociatedGroups) {
            unitYValue += groupObj.rankType.aSum + groupObj.rankType.bSum + groupObj.rankType.cSum;
            aSumYValue += groupObj.rankType.aSum;
            bSumYValue += groupObj.rankType.bSum;
            cSumYValue += groupObj.rankType.cSum;
          }

          // Setting the rank type sums
          drilldownDataTypes[0].y = aSumYValue;
          drilldownDataTypes[1].y = bSumYValue;
          drilldownDataTypes[2].y = cSumYValue;

          // Setting the data of the drilldown to the rank type sums
          unitDrilldownObj.data = drilldownDataTypes;

          // Setting the accumulate value of the associated groups
          unitDataObj.y = unitYValue;

          // Setting the main series object and drilldown object
          statisticsObj.mainSeries.push(unitDataObj);
          statisticsObj.drilldownSeries.push(unitDrilldownObj);
        }
        break;
    }

    return statisticsObj;
  }

}
