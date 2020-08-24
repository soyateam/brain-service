import { Request, Response, NextFunction } from "express";
import { PermissionHandler } from "../permissions/permission.handler";

export class TaskPermission {
  static async getTasksByParentId(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }

  static async getTasksByParentAndType(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }

  static async getTasksByType(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.get(req, res, next);
  }

  static async createTask(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.createOrUpdate(req, res, next);
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.createOrUpdate(req, res, next);
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    return PermissionHandler.createOrUpdate(req, res, next);
  }
}
