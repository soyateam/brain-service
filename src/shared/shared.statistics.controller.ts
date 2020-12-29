// shared.statistics.controller

import { StatisticsTypes, DateFilterTypes } from './shared.statistics.types';
import { StatisticsUtils } from './shared.statistics.utils';

export class StatisticsController {

  /**
   * Calculate regular statistics on simple sum statistics.
   * @param statisticsType - The type of statistics to calculate.
   * @param taskId - The id of the task to calculate statistics on.
   */
  public static async calculateStatisticsSum(
    statisticsType: StatisticsTypes,
    taskId: string,
    showSubTasks: boolean,
    parentGroupId?: string,
    dateFilter?: string,
  ) {
    switch (statisticsType) {

      case (StatisticsTypes.Sum):
      case (StatisticsTypes.ServiceSum):
      case (StatisticsTypes.RankSum):
        if (showSubTasks) {
          return await StatisticsUtils.calculateSubTasksRegularSum(taskId, statisticsType, dateFilter);
        }
        return StatisticsUtils.calculateRegularSum(taskId, statisticsType, dateFilter);
      case (StatisticsTypes.UnitTaskCount):
        return await StatisticsUtils.calculateUnitTasksCount(taskId, parentGroupId, dateFilter);

      case (StatisticsTypes.UnitSum):
      case (StatisticsTypes.UnitServiceSum):
      case (StatisticsTypes.UnitRankSum):
        return await StatisticsUtils.calculateUnitSum(taskId, statisticsType, dateFilter);
    }
  }

  /**
   * Calculate view statistics by unit filter and month filter.
   * @param unitFilter - Unit filter for the calculation.
   * @param dateFilter - Date filter for the calculation.
   */
  public static async calculateViewStatistics(unitFilter: string, dateFilter: string) {
    return await StatisticsUtils.calculateViewStatistics(unitFilter, dateFilter);
  }

  /**
   * Get date filters available (for groups/tasks)
   * @param type - Date filter type (groups/tasks).
   */
  public static async getDateFilters(type: DateFilterTypes) {
    return await StatisticsUtils.getDateFilters(type);
  }

  /**
   * Get unit filters available (in the group hierarchy tree)
   * @param dateFilter - Date filter time for the groups.
   */
  public static async getUnitFilters(dateFilter?: string) {
    return await StatisticsUtils.getUnitFilters(dateFilter);
  }
}
