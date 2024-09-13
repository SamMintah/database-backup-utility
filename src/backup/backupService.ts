import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { sendSlackNotification } from '../utils/slack';
import logger from '../utils/logger';
import { config } from '../config/config';
import { BackupOptions } from '../type';
import { createZipBackup } from './compress';
import { createCloudStorageProvider } from '../cloud/storageFactory';

const execPromise = promisify(exec);

export async function backupDatabase(options: BackupOptions) {
  try {
    const { db, cloud } = options;
    const globalBackupPath = config.db.backupPath;

    if (!globalBackupPath) {
      throw new Error('Global backup path is not defined in the config.');
    }

    // Perform the backup based on the database type
    switch (db.toLowerCase()) {
      case 'mysql':
        await backupMySQL(globalBackupPath);
        break;
      case 'postgres':
        await backupPostgres(globalBackupPath);
        break;
      case 'mongodb':
        await backupMongoDB(globalBackupPath);
        break;
      case 'sqlite':
        await backupSQLite(globalBackupPath);
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

      await cloudStorage.upload(globalBackupPath, bucketName);
    }
  } catch (error) {
    logger.error(`Backup failed: ${error}`);
    await sendSlackNotification('Backup failed!');
  }
}

async function backupMySQL(backupPath: string) {
  const { host, user, password, database } = config.db.mysql;

  if (!host || !user || !password || !database) {
    throw new Error('MySQL configuration is not complete.');
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

async function backupPostgres(backupPath: string) {
  const { host, user, password, database } = config.db.postgres;

  if (!host || !user || !password || !database) {
    throw new Error('PostgreSQL configuration is not complete.');
  }

  try {
    // Ensure the backup directory exists
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
      logger.info(`Created backup directory: ${backupPath}`);
    }

    const sqlBackupFilePath = path.join(backupPath, `backup_${new Date().toISOString().split('T')[0]}.sql`);
    const zipBackupFilePath = path.join(backupPath, `backup_${new Date().toISOString().split('T')[0]}.zip`);

    // Construct the pg_dump command with the file path
    const command = `PGPASSWORD=${password} pg_dump -h ${host} -U ${user} -d ${database} -f ${sqlBackupFilePath}`;
    await execPromise(command);

    // Create a zip file containing the SQL backup
    await createZipBackup(sqlBackupFilePath, zipBackupFilePath);
    fs.unlinkSync(sqlBackupFilePath);
  } catch (error) {
    logger.error(`PostgreSQL backup failed: ${error}`);
  }
}

async function backupMongoDB(backupPath: string) {
  const uri = config.db.mongodb.uri;

  if (!uri) {
    throw new Error('MongoDB URI is not defined.');
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

async function backupSQLite(backupPath: string) {
  const filename = config.db.sqlite.filename;

  if (!filename) {
    throw new Error('SQLite filename is not defined.');
  }

  try {
    await new Promise<void>((resolve, reject) => {
      // Use fs to copy the SQLite database file for backup
      fs.copyFile(filename, backupPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('SQLite backup completed successfully');
  } catch (error) {
    logger.error(`SQLite backup failed: ${error}`);
  }
}
