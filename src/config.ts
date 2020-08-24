// config

const config = {
  taskServiceUrl: process.env.TASK_SERVICE_URL,
  groupServiceUrl: process.env.GROUP_SERVICE_URL,
  authentication: {
    key: process.env.AUTHENTICATION_PUBLIC_KEY || "publickey",
    required: process.env.AUTHENTICATION_REQUIRED || false,
  },
};

export default config;
