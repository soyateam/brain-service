// group.manager

import config from '../config';
import { HttpClient } from '../utils/http.client';

export class GroupManager {

  private static readonly groupsUrl = `${config.groupServiceUrl}/api/group`;

  /**
   * Get group by id.
   * @param groupId - The id of the group.
   * @param dateFilter - Date filter of the group.
   */
  public static async getGroupById(groupId: string, dateFilter?: string) {
    return (await HttpClient.get(`${GroupManager.groupsUrl}/${groupId}${dateFilter ? `?date=${dateFilter}` : ''}`));
  }

  /**
   * Get group children by id.
   * @param groupId - The id of the group.
   * @param dateFilter - Date filter of the groups.
   */
  public static async getGroupChildrenById(groupId: string, dateFilter?: string) {
    return (await HttpClient.get(`${GroupManager.groupsUrl}/children/${groupId}${dateFilter ? `?date=${dateFilter}` : ''}`));
  }

  /**
   * Get all the units exists in the groups hierarchy tree.
   * @param dateFilter - Date filter of the groups.
   */
  public static async getUnits(dateFilter?: string) {
    return (await HttpClient.get(`${GroupManager.groupsUrl}/units${dateFilter ? `?date=${dateFilter}` : ''}`));
  }

  /**
   * Get multiple groups by array of group ids.
   * @param groupsIds - Array of group ids.
   * @param dateFilter - Date filter of the group.
   */
  public static async getManyGroups(groupsIds: string[], dateFilter?: string) {
    return (await HttpClient.post(`${GroupManager.groupsUrl}/${dateFilter ? `?date=${dateFilter}`: ''}`, { ids: groupsIds }));
  }

  /**
   * Get all units sums by unit names.
   * @param unitsNames - Array of unit names.
   * @param dateFilter - Date filter of the group.
   */
  public static async getUnitsSums(unitsNames: string[], dateFilter?: string) {
    return (await HttpClient.post(`${GroupManager.groupsUrl}/unit${dateFilter ? `?date=${dateFilter}`: ''}`, { unitsNames }));
  }

  /**
   * Get available date filters for tasks
   */
  public static async getDateFilters() {
    return await HttpClient.get(`${GroupManager.groupsUrl}/dates`);
  }
}
