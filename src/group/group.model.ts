import mongoose, { Schema } from 'mongoose';
import { IGroup } from './group.interface';

// Tasks within group schema
const taskSchema = new Schema({
  parent: {
    type: Schema.Types.ObjectId,
    default: null,
    // validate: {
    //   validator: () => Promise.resolve(TaskValidator.isParentValid) as any,
    //   message: 'Parent {VALUE} does not exist',
    // },
  },
  type: {
    type: String,
    required: true,
    // enum: Object.keys(TaskType),
  },
  name: {
    type: String,
    required: true,
    // validate: [TaskValidator.isNameValid, 'Invalid task name given.'],
  },
  description: {
    type: String,
    // validate: [TaskValidator.isDescriptionValid, 'Invalid task description given.'],
  },
  peopleSum: {
    type: Number,
    default: 0,
    required: true,
  },
  serviceType: {
    kevaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    hovaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    civilianSum: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  rankType: {
    aSum: {
      type: Number,
      default: 0,
      required: true,
    },
    bSum: {
      type: Number,
      default: 0,
      required: true,
    },
    cSum: {
      type: Number,
      default: 0,
      required: true,
    },
    dSum: {
      type: Number,
      default: 0,
      required: true,
    },
    hovaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    civilianSum: {
      type: Number,
      default: 0,
      required: true,
    },
  },
});

taskSchema.add({
  children: {
    type: [taskSchema],
    default: [],
    required: true
  }
});

const groupSchema = new Schema({
  date: {
    type: Date,
    default: () => {
      const currDate = new Date();

      currDate.setHours(0);
      currDate.setMinutes(0);
      currDate.setSeconds(0);

      return currDate;
    },
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  kartoffelID: {
    type: String,
    required: true,
    // unique: true,
    index: true,
  },
  parent: {
    type: String,
    required: true,
    default: null,
  },
  ancestors: {
    type: [String],
    default: [],
    required: true,
  },
  children: {
    type: [String],
    default: [],
    required: true,
  },
  isMador: {
    type: Boolean,
    default: false,
    required: true,
  },
  unitName: {
    type: String,
  },
  peopleSum: {
    type: Number,
    default: 0,
    required: true,
  },
  hierarchy: {
    type: [String],
  },
  serviceType: {
    kevaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    hovaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    civilianSum: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  rankType: {
    aSum: {
      type: Number,
      default: 0,
      required: true,
    },
    bSum: {
      type: Number,
      default: 0,
      required: true,
    },
    cSum: {
      type: Number,
      default: 0,
      required: true,
    },
    dSum: {
      type: Number,
      default: 0,
      required: true,
    },
    hovaSum: {
      type: Number,
      default: 0,
      required: true,
    },
    civilianSum: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  assignedCount: {
    type: Number,
    default: 0,
    required: true,
  },
  tasks: {
    type: [taskSchema],
    default: [],
    required: true
  }
});

groupSchema.index({ date: 1, kartoffelID: 1 });
groupSchema.index({ date: 1, kartoffelID: 1 }, { unique: true });

// Virtual populate, we need to use this way because we populated children not by their mongo _id, but by the kartoffelID
// populate from group schema (ref) from localfield children
groupSchema.virtual('childrenPopulated', { ref: 'group', localField: 'children', foreignField: 'kartoffelID' });

export const GroupModel = mongoose.model<IGroup>('group', groupSchema);
