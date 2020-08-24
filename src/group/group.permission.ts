import { Request, Response, NextFunction } from "express";
import { PermissionHandler } from "../permissions/permission.handler";

export class GroupPermission {
  static async getGroupsByParent(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }

  static async getGroupById(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }
}
