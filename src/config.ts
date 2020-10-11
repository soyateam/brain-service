// config

const config = {
  serviceName: 'brain-service',
  taskServiceUrl: process.env.TASK_SERVICE_URL,
  groupServiceUrl: process.env.GROUP_SERVICE_URL,
  logs: {
    connectionStringLogs: process.env.MONGO_CONNECTION_STRING_LOGS || 'mongodb://mongo:27017/logs',
    expiredInSec: 2592000, // 30 days
  },
  authentication: {
    secret: process.env.SECRET_KEY || 'iamsososecret!youcaneverguess',
    required: process.env.AUTHENTICATION_REQUIRED || false,
  },
};

export default config;
