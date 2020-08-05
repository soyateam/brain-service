// task.interface
import { ITag } from '../tag/tag.interface';

enum TaskType {
  TYPE1,
  TYPE2,
}

export interface ITask {
  parentId: string;
  type: TaskType;
  name: string;
  description: string;
  tag: ITag;
  organizationIds: string[];
}
