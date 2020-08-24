// group.routes

import { Router } from "express";
import { Wrapper } from "../utils/wrapper";
import { GroupController } from "./group.controller";
import { GroupPermission } from "./group.permission";

export class GroupRouter {
  public static router() {
    const router: Router = Router();

    router.get(
      "/parent/:id",
      Wrapper.wrapAsync(GroupPermission.getGroupsByParent),
      Wrapper.wrapAsync(GroupController.getGroupsByParent)
    );
    router.get(
      "/:id",
      Wrapper.wrapAsync(GroupPermission.getGroupsByParent),
      Wrapper.wrapAsync(GroupController.getGroupById)
    );

    return router;
  }
}
