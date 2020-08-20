// server

import * as http from "http";
import app from "./app";
import { log } from "./utils/logger/logger";

http.createServer(app).listen(app.get("port"), () => {
  const logMessage = `Brain Server is running at port ${app.get("port")} in ${app.get("env")} mode`;

  log(logMessage);
  console.log("Press CTRL-C to stop\n");
});
