// task.interface

import { IBaseModel } from "../generic/generic.interface";

export enum TaskType {
  BuildForce = 'BuildForce',
  OperativeForce = 'OperativeForce',
}

export interface IGroup {
  id: string;
  name: string;
  isClicked: boolean;
}

export interface ITask extends IBaseModel {
  parent: string | null;
  type: TaskType;
  name: string;
  description: string;
  groups: IGroup[];
  ancestors: string[];
  sum: number;
  subTasksCount: number;
}

export const collectionName = 'Task';