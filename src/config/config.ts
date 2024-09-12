// src/config/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  db: {
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
      backupPath: process.env.MYSQL_BACKUP_PATH || 'backup.sql'
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      user: process.env.POSTGRES_USER || 'user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DATABASE || 'test',
      backupPath: process.env.POSTGRES_BACKUP_PATH || 'backup/'
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      backupPath: process.env.MONGODB_BACKUP_PATH || 'backup/'
    },
    sqlite: {
      filename: process.env.SQLITE_DATABASE || 'test.db',
      backupFilename: process.env.SQLITE_BACKUP_DATABASE || 'backup.db'
    }
  },
  cloud: {
    provider: process.env.CLOUD_PROVIDER || 's3', // 's3', 'google', 'azure'
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
    },
    google: {
      bucket: process.env.GCS_BUCKET,
      projectId: process.env.GCS_PROJECT_ID,
    },
    azure: {
      bucket: process.env.AZURE_CONTAINER || '',
      connectionString: process.env.AZURE_CONNECTION_STRING || '',
    },
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL
  }
};
