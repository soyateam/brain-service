// shared.statistics.types

export enum StatisticsTypes {
  Sum = 'Sum',
  ServiceSum = 'ServiceSum',
  RankSum = 'RankSum',
  UnitSum = 'UnitSum',
  UnitServiceSum = 'UnitServiceSum',
  UnitRankSum = 'UnitRankSum',
  UnitTaskCount = 'UnitTaskCount',
}

export const fromFieldToDisplayName = {
  peopleSum: 'כמות אנשים',
  kevaSum: 'קבע',
  hovaSum: 'חובה',
  miluimSum: 'מילואים',
  civilianSum: 'אזרח',
  aSum: 'א',
  bSum: 'ב',
  cSum: 'ג',
  unitTaskCount: 'כמות משימות',
};
