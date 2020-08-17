// app

import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './utils/error.handler';
import { TaskRouter } from './task/task.routes';

// App initialization
const app = express();

// Morgan formatting types for each environment
const morganFormatting: any = { prod: 'common', dev: 'dev', test: 'tiny' };

// Middlewares
app.set('port', process.env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(morganFormatting[process.env.NODE_ENV || 'dev']));
app.use(helmet());

/* Routes */

// Health check for Load Balancer
app.get('/health', (req, res) => res.send('alive'));

app.use('/task', TaskRouter.router());

// Error handler
app.use(errorHandler);

// Handling all unknown route request with 404
app.all('*', (req, res) => {
  res.status(404).send({ message: 'Page not found' });
});

export default app;
