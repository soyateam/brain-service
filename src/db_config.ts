// db_config

import mongoose from 'mongoose';
import config from './config';
import { log } from './utils/logger/logger';
import { SeverityLevel } from './utils/logger/severityLevel';

export const connectToMongo = async () => {
  log(SeverityLevel.INFO, `[MongoDB] trying to mongo server:  ${config.mongoUrl}`);
  try {
    await mongoose.connect(config.mongoUrl, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
  } catch (err) {
    log(SeverityLevel.ERROR, `did not connect to ${config.mongoUrl}. error: ${err}`, err);
    return;
  }

  log(SeverityLevel.INFO, `successfully connected: ${config.mongoUrl}`);
};
