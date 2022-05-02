export default class TaskUtils {

  public static createTree(data: any) {
    if (data) {
      data.children.push({
        name: data.name,
        _id: data._id,
        parent: data.parent,
        groups: data.groups,
        ancestors: data.ancestors,
        description: data.description,
        type: data.type,
        date: data.date,
      });

      return TaskUtils.createTreeInternal(data, data._id.toString());
    }

    return {};
  }

  private static createTreeInternal(data: any, currId: any) {
    const childs = data.children.filter((val: any) => {
      return val.parent !== null && val.parent.toString() === currId.toString()
    });
    const currObj = data.children.filter((val: any) => {
      return val._id.toString() === currId.toString();
    })[0];
    if (childs.length === 0) {
      return {
        ...currObj,
        children: [],
      };
    }

    // console.log(childs);
    const childrenArr = [];
    const newObj = {
      ...currObj,
      children: [],
    };

    for (const child of childs) {
      childrenArr.push(TaskUtils.createTreeInternal(data, child._id.toString()));
    }

    newObj.children = childrenArr;

    return newObj;
  }
}
