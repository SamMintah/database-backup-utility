import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { RestoreOptions } from '../type';
import { config } from '../config/config';
import logger from '../utils/logger';
import { decompressFile } from '../backup/compress';
import { createCloudStorageProvider } from '../cloud/storageFactory';

const execPromise = promisify(exec);

export async function restoreDatabase(options: RestoreOptions) {
  try {
    const { db, cloud } = options;

    if (cloud) {
      await downloadFromCloud(cloud);
    }

    await decompressBackupFiles();

    switch (db.toLowerCase()) {
      case 'mysql':
        await restoreMySQL();
        break;
      case 'postgres':
        await restorePostgres();
        break;
      case 'mongodb':
        await restoreMongoDB();
        break;
      case 'sqlite':
        await restoreSQLite();
        break;
      default:
        throw new Error(`Unsupported database type: ${db}`);
    }

    logger.info('Restore completed successfully');
  } catch (error) {
    logger.error(`Restore failed: ${error}`);
  }
}
// Function to download backup from cloud storage
async function downloadFromCloud(cloud: {
  bucketName?: string;
  provider?: string;
}) {
  if (!cloud || !cloud.provider) {
    throw new Error('Cloud provider is not specified');
  }

  const cloudStorage = createCloudStorageProvider();
  const provider = cloud.provider.toLowerCase();
  const backupFileName = 'backup.gz';

  switch (provider) {
    case 's3':
      await cloudStorage.download(backupFileName, cloud.bucketName || '');
      break;
    case 'google':
      await cloudStorage.download(backupFileName, cloud.bucketName || '');
      break;
    case 'azure':
      await cloudStorage.download(backupFileName, cloud.bucketName || '');
      break;
    default:
      throw new Error(`Unsupported cloud provider: ${provider}`);
  }
}

async function restoreMySQL() {
  const { host, user, password, database, backupPath } = config.db.mysql;

  if (!host || !user || !password || !database || !backupPath) {
    throw new Error('MySQL configuration or backup path is not defined');
  }

  try {
    // Construct the mysql command
    const command = `mysql -h ${host} -u ${user} -p${password} ${database} < ${backupPath}`;

    // Execute the mysql command
    await execPromise(command);

    logger.info('MySQL database restored successfully');
  } catch (error) {
    logger.error(`MySQL restore failed: ${error}`);
  }
}

async function restorePostgres() {
  const { host, user, password, database } = config.db.postgres;
  const backupPath = config.db.postgres.backupPath;

  if (!host || !user || !password || !database || !backupPath) {
    throw new Error('PostgreSQL configuration or backup path is not defined');
  }

  try {
    // Construct the pg_restore command
    const command = `PGPASSWORD=${password} pg_restore -h ${host} -U ${user} -d ${database} ${backupPath}`;

    // Execute the pg_restore command
    await execPromise(command);

    logger.info('PostgreSQL database restored successfully');
  } catch (error) {
    logger.error(`PostgreSQL restore failed: ${error}`);
  }
}

async function restoreMongoDB() {
  const uri = config.db.mongodb.uri;
  const backupPath = config.db.mongodb.backupPath;
  if (!uri || !backupPath) {
    throw new Error('MongoDB URI or backup path is not defined');
  }

  try {
    // Construct the mongorestore command
    const command = `mongorestore --uri="${uri}" ${backupPath}`;

    // Execute the mongorestore command
    await execPromise(command);
    logger.info('MongoDB database restored successfully');
  } catch (error) {
    logger.error(`MongoDB restore failed: ${error}`);
  }
}

async function restoreSQLite() {
  const filename = config.db.sqlite.filename;
  const backupFilename = config.db.sqlite.backupFilename;
  if (!filename || !backupFilename) {
    throw new Error('SQLite filename or backup filename is not defined');
  }
  if (!filename) {
    throw new Error('SQLite filename is not defined');
  }
  try {
    await new Promise<void>((resolve, reject) => {
      fs.copyFile(backupFilename, filename, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('SQLite database restored successfully');
  } catch (error) {
    logger.error(`SQLite restore failed: ${error}`);
  }
}

async function decompressBackupFiles() {
  const backupPaths = [
    config.db.mysql.backupPath,
    config.db.postgres.backupPath,
    config.db.mongodb.backupPath,
    config.db.sqlite.backupFilename
  ];

  for (const backupPath of backupPaths) {
    if (backupPath && fs.existsSync(`${backupPath}.gz`)) {
      await decompressFile(`${backupPath}.gz`);
    }
  }
}
