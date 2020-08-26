// app

import express from 'express';
import cors from 'cors';
import config from './config';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './utils/error.handler';
import { TaskRouter } from './task/task.routes';
import { GroupRouter } from './group/group.routes';
import { SharedRouter } from './shared/shared.routes';
import { Authenticator } from './utils/auth/authenticator';
import { validTokenMock } from './utils/auth/user.mock';

// App initialization
const app = express();

const options: cors.CorsOptions = {
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Access-Token',
    'authorization',
  ],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: '*',
  preflightContinue: false,
};

app.use(cors(options));

const addMockToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  req.headers.authorization = validTokenMock();
  return next();
};

// Morgan formatting types for each environment
const morganFormatting: any = { prod: 'common', dev: 'dev', test: 'tiny' };

// Middlewares
app.set('port', process.env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(morganFormatting[process.env.NODE_ENV || 'dev']));
app.use(helmet());

if (!config.authentication.required) app.use(addMockToken);

app.use(Authenticator.initialize());
app.use(Authenticator.middleware);

/* Routes */

// Health check for Load Balancer
app.get('/health', (req, res) => res.send('alive'));

app.use('/api/task', TaskRouter.router());
app.use('/api/group', GroupRouter.router());
app.use('/api/shared', SharedRouter.router());

// Error handler
app.use(errorHandler);

// Handling all unknown route request with 404
app.all('*', (req, res) => {
  res.status(404).send({ message: 'Page not found' });
});

export default app;
