// config

const config = {
  // MongoDB Url
  mongoUrl:
    `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.MONGO_URL}`,
};

export default config;
