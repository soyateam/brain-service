// task.interface

enum TaskType {
  BuildForce = 'BuildForce',
  OperativeForce = 'OperativeForce',
}

export interface IGroup {
  id: string;
  name: string;
}

export interface ITask {
  parent: string;
  type: TaskType;
  name: string;
  description: string;
  groups: IGroup;
  ancestors: string[];
}
