import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { sendSlackNotification } from '../utils/slack';
import logger from '../utils/logger';
import { config } from '../config/config';
import { BackupOptions } from '../type';
import { compressFile } from './compress';
import { createCloudStorageProvider } from '../cloud/storageFactory';

const execPromise = promisify(exec);

export async function backupDatabase(options: BackupOptions) {
  try {
    const { db, cloud } = options;

    let backupPath: string;
    switch (db.toLowerCase()) {
      case 'mysql':
        await backupMySQL();
        backupPath = config.db.mysql.backupPath;
        break;
      case 'postgres':
        await backupPostgres();
        backupPath = config.db.postgres.backupPath;
        break;
      case 'mongodb':
        await backupMongoDB();
        backupPath = config.db.mongodb.backupPath;
        break;
      case 'sqlite':
        await backupSQLite();
        backupPath = config.db.sqlite.backupFilename;
        break;
      default:
        throw new Error(`Unsupported database type: ${db}`);
    }

    // Handle cloud storage upload if configuration is provided
    if (cloud) {
      const cloudStorage = createCloudStorageProvider();
      const cloudProvider =
        config.cloud[cloud.provider as keyof typeof config.cloud];
      if (!cloudProvider) {
        throw new Error(`Unsupported cloud provider: ${cloud.provider}`);
      }

      let bucketName: string;
      const provider = config.cloud.provider.toLowerCase();

      switch (provider) {
        case 's3':
          bucketName = cloud.bucketName || config.cloud.s3.bucket || '';
          break;
        case 'google':
          bucketName = cloud.bucketName || config.cloud.google.bucket || '';
          break;
        case 'azure':
          bucketName = cloud.bucketName || config.cloud.azure.bucket || '';
          break;
        default:
          throw new Error(`Unsupported cloud provider: ${provider}`);
      }

      if (backupPath) {
        await cloudStorage.upload(backupPath, bucketName);
      } else {
        throw new Error(`Backup path for ${db} is not defined`);
      }
    }

    await compressFile(backupPath);

    await sendSlackNotification('Backup completed successfully!');
    logger.info('Backup completed successfully');
  } catch (error) {
    logger.error(`Backup failed: ${error}`);
    await sendSlackNotification('Backup failed!');
  }
}
async function backupMySQL() {
  const { host, user, password, database, backupPath } = config.db.mysql;

  if (!host || !user || !password || !database || !backupPath) {
    throw new Error('MySQL configuration or backup path is not defined');
  }

  try {
    // Construct the mysqldump command
    const command = `mysqldump -h ${host} -u ${user} -p${password} ${database} > ${backupPath}`;

    // Execute the mysqldump command
    await execPromise(command);

    logger.info('MySQL backup completed successfully');
  } catch (error) {
    logger.error(`MySQL backup failed: ${error}`);
  }
}

async function backupPostgres() {
  const { host, user, password, database, backupPath } = config.db.postgres;

  if (!host || !user || !password || !database || !backupPath) {
    throw new Error('PostgreSQL configuration or backup path is not defined');
  }

  try {
    // Construct the pg_dump command
    const command = `PGPASSWORD=${password} pg_dump -h ${host} -U ${user} -d ${database} -f ${backupPath}`;

    // Execute the pg_dump command
    await execPromise(command);

    logger.info('PostgreSQL backup completed successfully');
  } catch (error) {
    logger.error(`PostgreSQL backup failed: ${error}`);
  }
}

async function backupMongoDB() {
  const uri = config.db.mongodb.uri;
  const backupPath = config.db.mongodb.backupPath;

  if (!uri || !backupPath) {
    throw new Error('MongoDB URI or backup path is not defined');
  }

  try {
    // Construct the mongodump command
    const command = `mongodump --uri="${uri}" --out=${backupPath}`;

    // Execute the mongodump command
    await execPromise(command);

    logger.info('MongoDB backup completed successfully');
  } catch (error) {
    logger.error(`MongoDB backup failed: ${error}`);
  }
}

async function backupSQLite() {
  const filename = config.db.sqlite.filename;
  const backupFilename = config.db.sqlite.backupFilename;

  if (!filename || !backupFilename) {
    throw new Error('SQLite filename or backup filename is not defined');
  }

  try {
    await new Promise<void>((resolve, reject) => {
      // Use fs to copy the SQLite database file for backup
      fs.copyFile(filename, backupFilename, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('SQLite backup completed successfully');
  } catch (error) {
    logger.error(`SQLite backup failed: ${error}`);
  }
}
