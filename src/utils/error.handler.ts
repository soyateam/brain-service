// error.handler

import { Request, Response, NextFunction } from 'express';
import { BaseError } from './error';
import { log } from './logger/logger';
import { SeverityLevel } from './logger/severityLevel';

// TODO: Error type correction
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error) {
    console.log(error);
    if (error instanceof BaseError) {
      log(SeverityLevel.ERROR, { status: error.status }, error);
      return res.status(error.status).send({ message: error.message });
    }

    if (error.isAxiosError) {
      if (error.response) {
        log(SeverityLevel.ERROR, { status: error.response.status }, error);
        return res.status(error.response.status).send(error.response.data);
      }

      log(SeverityLevel.ERROR, { status: error }, error);
      return res.status(error).send(error);
    }

    // Other errors
    log(SeverityLevel.ERROR, { status: error.status || 500 }, error);
    return res.status(error.status || 500)
              .send({ message: error.message || 'Internal Server Error' });
  }
}
