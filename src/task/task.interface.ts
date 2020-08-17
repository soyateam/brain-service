// task.interface

enum TaskType {
  BuildForce = 'BuildForce',
  OperativeForce = 'OperativeForce',
}

export interface ITask {
  parent: string;
  type: TaskType;
  name: string;
  description: string;
  orgIds: string[];
  ancestors: string[];
}
