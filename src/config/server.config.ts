import * as dotenv from 'dotenv';

dotenv.config();

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  key: process.env.API_KEY || 'supersecret',
  env: process.env.NODE_ENV || 'development'
};
