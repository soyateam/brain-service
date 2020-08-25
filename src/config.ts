// config

const config = {
  taskServiceUrl: process.env.TASK_SERVICE_URL,
  groupServiceUrl: process.env.GROUP_SERVICE_URL,

  authentication: {
    secret: process.env.SECRET_KEY || 'iamsososecret!youcaneverguess',
    required: process.env.AUTHENTICATION_REQUIRED || false,
  },
};

export default config;
