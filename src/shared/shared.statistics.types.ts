// shared.statistics.types

export enum StatisticsTypes {
  Sum = 'Sum',
  ServiceSum = 'ServiceSum',
  RankSum = 'RankSum',
  UnitSum = 'UnitSum',
  UnitServiceSum = 'UnitServiceSum',
  UnitRankSum = 'UnitRankSum',
}

export const fromFieldToDisplayName = {
  peopleSum: 'כמות אנשים',
  kevaSum: 'קבע',
  hovaSum: 'חובה',
  aSum: 'א',
  bSum: 'ב',
  cSum: 'ג',
};
