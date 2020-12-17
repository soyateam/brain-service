// shared.statistics.controller

import { StatisticsTypes } from './shared.statistics.types';
import { StatisticsUtils } from './shared.statistics.utils';

export class StatisticsController {

  /**
   * Calculate regular statistics on simple sum statistics.
   * @param statisticsType - The type of statistics to calculate.
   * @param taskId - The id of the task to calculate statistics on.
   */
  public static async calculateStatisticsSum(
    statisticsType: StatisticsTypes, taskId: string, showSubTasks: boolean, parentGroupId?: string,
  ) {
    switch (statisticsType) {

      case (StatisticsTypes.Sum):
      case (StatisticsTypes.ServiceSum):
      case (StatisticsTypes.RankSum):
        if (showSubTasks) {
          return await StatisticsUtils.calculateSubTasksRegularSum(taskId, statisticsType);
        }
        return StatisticsUtils.calculateRegularSum(taskId, statisticsType);
      case (StatisticsTypes.UnitTaskCount):
        return await StatisticsUtils.calculateUnitTasksCount(taskId, parentGroupId);

      case (StatisticsTypes.UnitSum):
      case (StatisticsTypes.UnitServiceSum):
      case (StatisticsTypes.UnitRankSum):
        return await StatisticsUtils.calculateUnitSum(taskId, statisticsType);
    }
  }

  /**
   * Calculate view statistics by unit filter and month filter.
   * @param unitFilter - Unit filter for the calculation.
   * @param monthFilter - Month filter for the calculation.
   */
  public static async calculateViewStatistics(unitFilter: string, monthFilter: string) {
    return await StatisticsUtils.calculateViewStatistics(unitFilter, monthFilter);
  }
}
