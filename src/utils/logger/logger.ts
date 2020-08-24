// logger

import * as winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { SeverityLevel } from './severityLevel';

const logger = winston.createLogger({
  defaultMeta: { service: 'Brain-Service' },
  format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.json()),
  transports: [new winston.transports.Console()],
});

if (process.env.NODE_ENV === 'prod') {
  logger.add(
    new winstonDailyRotateFile({
      level: SeverityLevel.INFO,
      datePattern: 'YYYY-MM-DD',
      filename: process.env.LOG_FILE_NAME || 'brain-service-%DATE%.log',
      dirname: process.env.LOG_FILE_DIR || '.',
    })
  );
}

export const log = (severity: SeverityLevel = SeverityLevel.INFO, logMessage: any, error?: any) => {
  const errorDetails = error ? { error: { message: error.message, stack: error.stack, name: error.name } } : {};

  logger.log({
    level: severity,
    message: logMessage,
    ...errorDetails,
  });
};
