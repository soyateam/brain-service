// group.interface

import { IBaseModel } from "../generic/generic.interface";

export interface IGroup extends IBaseModel {
  name: string;
  kartoffelID: string;
  ancestors: IGroup[] | string[];
  children: IGroup[] | string[];
  isMador: boolean;
  unitName: string;
  peopleSum: number;
  serviceType: IServiceType;
  rankType: IRankType;
  assignedCount: number;
  childrenPopulated?: IGroup[] | [];
}

export interface IServiceType {
  kevaSum: number;
  hovaSum: number;
  civilianSum: number;
}

export interface IRankType {
  aSum: number;
  bSum: number;
  cSum: number;
  dSum: number;
}

export const collectionName = 'group';
