// group.manager

import config from '../config';
import { HttpClient } from '../utils/http.client';

export class GroupManager {

  private static readonly groupsUrl = `${config.groupServiceUrl}/api/group`;

  /**
   * Get group by id.
   * @param groupId - The id of the group.
   */
  public static async getGroupById(groupId: string) {
    return (await HttpClient.get(`${GroupManager.groupsUrl}/${groupId}`));
  }

  /**
   * Get multiple groups by array of group ids.
   * @param groupsIds - Array of group ids.
   */
  public static async getManyGroups(groupsIds: string[]) {
    return (await HttpClient.post(`${GroupManager.groupsUrl}/group`, groupsIds));
  }
}
