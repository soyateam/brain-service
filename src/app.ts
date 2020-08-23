// app

import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './utils/error.handler';
import { TaskRouter } from './task/task.routes';
import { GroupRouter } from './group/group.routes';
import { SharedRouter } from './shared/shared.routes';

// import * as express from "express";
// import * as cors from "cors";
// import * as bodyParser from "body-parser";
// import * as cookieParser from "cookie-parser";
// import * as morgan from "morgan";
// import * as helmet from "helmet";
// import { errorHandler } from "./utils/error.handler";
// import { TaskRouter } from "./task/task.routes";
// import { GroupRouter } from "./group/group.routes";

// App initialization
const app = express();

const options: cors.CorsOptions = {
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'authorization'],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: '*',
  preflightContinue: false,
};

app.use(cors(options));

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
app.use('/group', GroupRouter.router());
app.use('/shared', SharedRouter.router());

// Error handler
app.use(errorHandler);

// Handling all unknown route request with 404
app.all('*', (req, res) => {
  res.status(404).send({ message: 'Page not found' });
});

export default app;
