// task.routes

import { Router } from "express";
import { Wrapper } from "../utils/wrapper";
import { TaskController } from "./task.controller";
import { TaskPermission } from "./task.permissions";

export class TaskRouter {
  public static router() {
    const router: Router = Router();
    router.get(
      "/type/:type",
      Wrapper.wrapAsync(TaskPermission.getTasksByType),
      Wrapper.wrapAsync(TaskController.getTasksByType)
    );
    router.get(
      "/parent/:parentId",
      Wrapper.wrapAsync(TaskPermission.getTasksByParentId),
      Wrapper.wrapAsync(TaskController.getTasksByParentId)
    );
    router.get("/:id", Wrapper.wrapAsync(TaskPermission.getTaskById), Wrapper.wrapAsync(TaskController.getTaskById));
    router.post("/", Wrapper.wrapAsync(TaskPermission.createTask), Wrapper.wrapAsync(TaskController.createTask));
    router.put("/", Wrapper.wrapAsync(TaskPermission.updateTask), Wrapper.wrapAsync(TaskController.updateTask));
    router.delete("/:id", Wrapper.wrapAsync(TaskPermission.deleteTask), Wrapper.wrapAsync(TaskController.deleteTask));

    return router;
  }
}
