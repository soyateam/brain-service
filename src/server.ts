// server

import * as http from 'http';
import app from './app';
import { log } from './utils/logger/logger';
import { SeverityLevel } from './utils/logger/severityLevel';

http.createServer(app).listen(app.get('port'), () => {
  const logMessage = `Brain Server is running at port ${app.get('port')} in ${app.get('env')} mode`;

  log(SeverityLevel.INFO, logMessage);
  console.log('Press CTRL-C to stop\n');
});
