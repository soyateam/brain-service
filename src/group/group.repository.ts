import { GroupModel } from './group.model';
import DateDumpModel from '../utils/dateDumpModel';
import config from '../config';
import { collectionName } from "./group.interface";


export class GroupRepository {

  static getModelByDate(dateFilter: string) {
    return DateDumpModel.getModelByDate(GroupModel, dateFilter);
  }

  static getById(kartoffelID: string, dateFilter?: string) {
    // if (dateFilter) {
    //   return GroupRepository.getModelByDate(dateFilter).findOne({ kartoffelID }).exec();
    // }
    const currDate = new Date();

    return GroupModel.findOne({
      kartoffelID, 
      $expr: { 
        $and: [
          { $eq: [{ $month: '$date' }, currDate.getMonth()] },
          { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
        ]
      }
    }).exec();
  }

  static async getManyByIds(ids: string[], dateFilter?: string) {
    let response: any = { groups: [], notFound: [] };
    await Promise.all(
      ids.map(async (id) => {
        const group = await GroupRepository.getById(id, dateFilter);
        group ? response.groups.push(group) : response.notFound.push(id);
      })
    );

    return response;
  }

  static getSumOfMainGroup(unitFilter?: string, dateFilter?: string) {

    const currDate = new Date();

    let aggregation: any = [
      {
        $match: {
          $expr: { 
            $and: [
              { $eq: [{ $month: '$date' }, currDate.getMonth()] },
              { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '',
          peopleSum: { $sum: '$peopleSum' },
        },
      },
      {
        $project: {
          _id: 0,
          peopleSum: 1,
        },
      },
    ];

    if (unitFilter) {
      aggregation = [
        {
          $match: {
            $and: [
              {
                $or: [
                  { ancestors: unitFilter },
                  { kartoffelID: unitFilter },
                ],
              },
              {
                $expr: { 
                  $and: [
                    { $eq: [{ $month: '$date' }, currDate.getMonth()] },
                    { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
                  ]
                }
              }
            ]
          },
        },
        {
          $group: {
            _id: '',
            peopleSum: { $sum: '$peopleSum' },
          },
        },
        {
          $project: {
            _id: 0,
            peopleSum: 1,
          },
        },
      ];
    }

    // if (dateFilter) {
    //   return GroupRepository.getModelByDate(dateFilter).aggregate(aggregation).exec();
    // }

    return GroupModel.aggregate(aggregation).exec();
  }

  static getChildrenByParentId(pId: string, dateFilter?: string) {
    // if (dateFilter) {
    //   return GroupRepository.getModelByDate(dateFilter).findOne({ kartoffelID: pId }).populate('childrenPopulated').exec();
    // }
    
    const currDate = new Date();

    return GroupModel.findOne({
      kartoffelID: pId,
      $expr: { 
        $and: [
          { $eq: [{ $month: '$date' }, currDate.getMonth()] },
          { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
        ]
      }  
    }).populate({
      path: 'childrenPopulated',
      match: {
        $expr: { 
          $and: [
            { $eq: [{ $month: '$date' }, currDate.getMonth()] },
            { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
          ]
        }
      }
    }).exec();
  }

  static getAllChildrenByParentId(pId: string, dateFilter?: string) {
    // if (dateFilter) {
    //   return GroupRepository.getModelByDate(dateFilter).find({ ancestors: { $all: [pId] }});
    // }

    const currDate = new Date();

    return GroupModel.find({
      ancestors: { $all: [pId] },
      $expr: { 
        $and: [
          { $eq: [{ $month: '$date' }, currDate.getMonth()] },
          { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
        ]
      }
    });
  }

  static updateByManyIds(groups: string[], amountChange: number) {
    const currDate = new Date();

    return GroupModel.updateMany(
      { 
        kartoffelID: { $in: groups },
        $expr: { 
          $and: [
            { $eq: [{ $month: '$date' }, currDate.getMonth()] },
            { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
          ]
        }
      },
      { $inc: { assignedCount: amountChange } }
    ).exec();
  }

  static updateById(id: string, amountChange: number) {
    const currDate = new Date();

    return GroupModel.findOneAndUpdate(
      { 
        kartoffelID: id,
        $expr: { 
          $and: [
            { $eq: [{ $month: '$date' }, currDate.getMonth()] },
            { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
          ]
        }
      },
      { $inc: { assignedCount: amountChange } },
      { new: true }
    ).exec();
  }

  static getUnitInfo(unitName: string, dateFilter?: string) {

    // if (dateFilter) {
    //   return GroupRepository.getModelByDate(dateFilter).aggregate([
    //     { $match: { unitName, $expr: { $eq: [{ $month: '$date'}, new Date().getMonth()] } } },
    //     {
    //       $group: {
    //         _id: "$unitName",
    //         groupsCount: { $sum: 1 },
    //         peopleSum: { $sum: "$peopleSum" },
    //         kevaSum: { $sum: "$serviceType.kevaSum" },
    //         hovaSumService: { $sum: "$serviceType.hovaSum" },
    //         civilianSumService: { $sum: "$serviceType.civilianSum" },
    //         aSum: { $sum: "$rankType.aSum" },
    //         bSum: { $sum: "$rankType.bSum" },
    //         cSum: { $sum: "$rankType.cSum" },
    //         dSum: { $sum: "$rankType.dSum" },
    //         hovaSumRank: { $sum: "$rankType.hovaSum" },            
    //         civilianSumRank: { $sum: "$rankType.civilianSum" },
    //       },
    //     },
    //     {
    //       $project: {
    //         groupsCount: 1,
    //         peopleSum: 1,
    //         serviceType: {
    //           kevaSum: "$kevaSum",
    //           hovaSum: "$hovaSumService",
    //           civilianSum: "$civilianSumService",
    //         },
    //         rankType: {
    //           aSum: "$aSum",
    //           bSum: "$bSum",
    //           cSum: "$cSum",
    //           dSum: "$dSum",
    //           hovaSum: "$hovaSumRank",
    //           civilianSum: "$civilianSumRank",
    //         },
    //       },
    //     },
    //   ]).exec();
    // }
    
    const currDate = new Date();

    return GroupModel.aggregate([
      { 
        $match: { 
          unitName, 
          $expr: { 
            $and: [
              { $eq: [{ $month: '$date' }, currDate.getMonth()] },
              { $eq: [{ $year: '$date' }, currDate.getFullYear()] }
            ]
          }
        },
      },
      {
        $group: {
          _id: "$unitName",
          groupsCount: { $sum: 1 },
          peopleSum: { $sum: "$peopleSum" },
          kevaSum: { $sum: "$serviceType.kevaSum" },
          hovaSumService: { $sum: "$serviceType.hovaSum" },
          civilianSumService: { $sum: "$serviceType.civilianSum" },
          aSum: { $sum: "$rankType.aSum" },
          bSum: { $sum: "$rankType.bSum" },
          cSum: { $sum: "$rankType.cSum" },
          dSum: { $sum: "$rankType.dSum" },
          hovaSumRank: { $sum: "$rankType.hovaSum" },
          civilianSumRank: { $sum: "$rankType.civilianSum" },
        },
      },
      {
        $project: {
          groupsCount: 1,
          peopleSum: 1,
          serviceType: {
            kevaSum: "$kevaSum",
            hovaSum: "$hovaSumService",
            civilianSum: "$civilianSumService",
          },
          rankType: {
            aSum: "$aSum",
            bSum: "$bSum",
            cSum: "$cSum",
            dSum: "$dSum",
            hovaSum: "$hovaSumRank",
            civilianSum: "$civilianSumRank",
          },
        },
      },
    ]).exec();
  }

  /**
   * Get all units names and ids.
   * @param dateFilter - Date filter for groups.
   */
  static async getUnitsNames(dateFilter?: string) {
    return this.getChildrenByParentId(config.RootGroupAncestorId, dateFilter);
  }

  /**
   * Get all date filters for groups.
   */
  static async getDateFilters() {
    // return await DateDumpModel.getAllDates(`${collectionName.toLowerCase()}s`);
    return await GroupModel.aggregate([
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        },
      }
    ])
  }
}
