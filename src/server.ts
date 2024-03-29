// server

// Must run that at first for configuration
require('elastic-apm-node').start({
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN || '',
  active: process.env.ELASTIC_APM_ACTIVE || false,
});

import * as http from 'http';
import app from './app';
import { connectToMongo } from './db_config';
import { log } from './utils/logger/logger';
import { SeverityLevel } from './utils/logger/severityLevel';


(async () => {
  await connectToMongo();

  http.createServer(app).listen(app.get('port'), () => {
    const logMessage = `Brain Server is running at port ${app.get('port')} in ${app.get('env')} mode`;
  
    log(SeverityLevel.INFO, logMessage);
    console.log('Press CTRL-C to stop\n');
  });
})();
