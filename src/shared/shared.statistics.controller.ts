// shared.statistics.controller

import { StatisticsTypes } from './shared.statistics.types';
import { StatisticsUtils } from './shared.statistics.utils';

export class StatisticsController {

  /**
   * Calculate regular statistics on simple sum statistics.
   * @param statisticsType - The type of statistics to calculate.
   * @param taskId - The id of the task to calculate statistics on.
   */
  public static calculateStatisticsSum(statisticsType: StatisticsTypes, taskId: string) {
    switch (statisticsType) {

      case (StatisticsTypes.Sum):
      case (StatisticsTypes.ServiceSum):
      case (StatisticsTypes.RankSum):
        return StatisticsUtils.calculateRegularSum(taskId, statisticsType);

      case (StatisticsTypes.UnitSum):
      case (StatisticsTypes.UnitServiceSum):
      case (StatisticsTypes.UnitRankSum):
        return StatisticsUtils.calculateUnitSum(taskId, statisticsType);
    }
  }
}
