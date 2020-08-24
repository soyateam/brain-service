import { Request, Response, NextFunction } from "express";
import { Unauthorized } from "../utils/error";
import { ROLE, IUser } from "../permissions/user.interface";

const READ_AND_WRITE = [ROLE.READ, ROLE.WRITE];

export class PermissionHandler {
  static async get(req: Request, res: Response, next: NextFunction) {
    if (!req.user) throw new Unauthorized();
    const user = req.user as IUser;

    if (READ_AND_WRITE.includes(user.role)) return next();

    next(new Unauthorized("User is not authorized to perform this action"));
  }

  static async createOrUpdate(req: Request, res: Response, next: NextFunction) {
    if (!req.user) throw new Unauthorized();
    const user = req.user as IUser;

    if (user.role == ROLE.WRITE) return next();

    next(new Unauthorized("User is not authorized to perform this action"));
  }
}
