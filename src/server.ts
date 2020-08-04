// server

import * as http from 'http';
import app from './app';

http.createServer(app).listen(app.get('port'), () => {
  const logMessage =
    `Authorization Server is running at port ${app.get('port')} in ${app.get('env')} mode`;

  console.log(logMessage);
  console.log('Press CTRL-C to stop\n');
});
