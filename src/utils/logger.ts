// logger

const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');

// log levels
export enum LOG_LEVEL {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

const logger = winston.createLogger({
  defaultMeta: { service: 'Task-Service' },
});

const format = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.json()
);

logger.add(
  new winstonDailyRotateFile({
    format,
    level: LOG_LEVEL.INFO,
    datePattern: 'YYYY-MM-DD',
    filename: process.env.LOG_FILE_NAME || 'log.txt',
    dirname: process.env.LOG_FILE_DIR || '.',
  })
);

export const log = (severity: string, meta: any, error?: any) => {
  const { message, ...other } = meta;
  const errorDetails = error
    ? { error: { message: error.message, stack: error.stack, name: error.name } }
    : {};

  logger.log(severity, message, { ...other, ...errorDetails });
};
