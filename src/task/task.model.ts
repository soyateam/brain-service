// task.model

import { Schema, model } from 'mongoose';
import { ITask, collectionName, TaskType } from './task.interface';
import { TaskValidator } from './task.validator';

const taskSchema = new Schema(
  {
    parent: {
      type: Schema.Types.ObjectId,
      default: null,
      validate: {
        validator: () => Promise.resolve(TaskValidator.isParentValid) as any,
        message: 'Parent {VALUE} does not exist',
      },
    },
    type: {
      type: String,
      required: true,
      enum: Object.keys(TaskType),
    },
    name: {
      type: String,
      required: true,
      validate: [TaskValidator.isNameValid, 'Invalid task name given.'],
    },
    description: {
      type: String,
      validate: [TaskValidator.isDescriptionValid, 'Invalid task description given.'],
    },
    groups: {
      type: {
        id: String,
        name: String,
        isClicked: Boolean
      },
      required: true,
      default: [],
    },
    ancestors: {
      type: [String],
      default: [],
      validate: {
        validator: () => Promise.resolve(TaskValidator.isAncestorsValid) as any,
        message: 'Ancestors has incorrect reference',
      },
    },
    sum: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (this.$$populatedVirtuals) {
    obj.subTasksCount = this.$$populatedVirtuals.subTasksCount;
  }
  delete obj.__v;
  return obj;
};

taskSchema.virtual('subTasksCount', {
  ref: collectionName,
  localField: '_id',
  foreignField: 'parent',
  count: true,
});

const taskModel = model<ITask>(collectionName, taskSchema);

export default taskModel;
