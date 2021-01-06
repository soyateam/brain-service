// shared.statistics.types

export enum StatisticsTypes {
  Sum = 'Sum',
  ServiceSum = 'ServiceSum',
  RankSum = 'RankSum',
  UnitSum = 'UnitSum',
  UnitServiceSum = 'UnitServiceSum',
  UnitRankSum = 'UnitRankSum',
  UnitTaskCount = 'UnitTaskCount',
  Timeline = 'Timeline',
}

export enum DateFilterTypes {
  Tasks = 'Tasks',
  Groups = 'Groups',
}

export const fromFieldToDisplayName = {
  peopleSum: 'כמות אנשים',
  kevaSum: 'קבע',
  hovaSum: 'חובה',
  civilianSum: 'אזרח',
  aSum: 'א',
  bSum: 'ב',
  cSum: 'ג',
  dSum: 'ד',
  unitTaskCount: 'כמות משימות',
};

export const majorTasksNameAndId = {
  BuildForce: '5f4cc9e2999432a15dbeab31',
  OperativeForce: '5f4cc74c999432075ebeab2f',
  Wide: '5fc61317fd6cf43fdd293552',
  Wrap: '5f689b32fc60a9ebdcaa7cbb',
};

export const fromMajorTaskIdToDisplayName = {
  '5f4cc74c999432075ebeab2f': 'הפעלת כוח',
  '5f4cc9e2999432a15dbeab31': 'יכולות',
  '5fc61317fd6cf43fdd293552': 'רוחב',
  '5f689b32fc60a9ebdcaa7cbb': 'מעטפת',
};

export const fromMajorTaskIdToDepthLevel = {
  '5f4cc74c999432075ebeab2f': 2,
  '5f4cc9e2999432a15dbeab31': 2,
  '5fc61317fd6cf43fdd293552': 1,
  '5f689b32fc60a9ebdcaa7cbb': 1,
};
