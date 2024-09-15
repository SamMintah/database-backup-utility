import { Command } from '@commander-js/extra-typings';
import * as dotenv from 'dotenv';
import logger from './utils/logger';
import { backupDatabase } from './backup/backupService';
import { restoreDatabase } from './restore/restoreService';
import { scheduleBackup } from './schedule/scheduler';
import { sendSlackNotification } from './utils/slack';
import { BackupOptions, RestoreOptions, ScheduleOptions } from './type';

dotenv.config();

const program = new Command();
program
  .name('db-backup-utility')
  .description('CLI tool to backup, restore, and schedule database backups')
  .version('1.0.0')
  .usage('[command] [options]');

// Backup command
program
  .command('backup')
  .description('Backs up the database')
  .option('-d, --db <db>', 'Database type (mysql, postgres, mongodb, sqlite)')
  .option('--cloud-provider <provider>', 'Cloud provider (aws, gcp, azure)')
  .option('--cloud-bucket <bucketName>', 'Name of the cloud storage bucket')
  .action(async (options: { db?: string; cloudProvider?: string; cloudBucket?: string }) => {
    try {
      if (!options.db) {
        logger.error('Database type is required for backup');
        process.exit(1); 
      }

      const backupOptions: BackupOptions = {
        db: options.db,
        cloud: options.cloudProvider && options.cloudBucket
          ? {
              provider: options.cloudProvider,
              bucketName: options.cloudBucket
            }
          : undefined
      };

      await backupDatabase(backupOptions);
      logger.info('Backup completed successfully');
      await sendSlackNotification('Backup completed successfully');
    } catch (error) {
      logger.error(`Backup failed: ${error}`);
      await sendSlackNotification('Backup failed');
    }
  });

// Restore command
program
  .command('restore')
  .description('Restores the database from a backup file or cloud storage')
  .option('--cloud', 'Restore from cloud storage')
  .option('--provider <provider>', 'Cloud provider (aws, gcp, azure)')
  .option('--bucket <bucketName>', 'Name of the cloud storage bucket')
  .option('-d, --db <db>', 'Database type (mysql, postgres, mongodb, sqlite)')
  .action(async (options: { cloud?: boolean; provider?: string; bucket?: string; db?: string }) => {
    try {
      if (!options.db) {
        throw new Error('Database type must be specified');
      }

      const restoreOptions = {
        db: options.db,
        cloud: options.cloud && options.provider && options.bucket
          ? {
              provider: options.provider,
              bucketName: options.bucket
            }
          : undefined
      };

      await restoreDatabase(restoreOptions);
      logger.info('Restore completed successfully');
      await sendSlackNotification('Restore completed successfully');
    } catch (error) {
      logger.info(`Restore failed: ${error}`);
    }
  });

// Schedule backup command
program
  .command('schedule')
  .description('Schedules automatic backups using a cron expression')
  .option('-t, --time <cronTime>', 'Cron expression to schedule backups')
  .option('--cloud-provider <provider>', 'Cloud provider (aws, gcp, azure)')
  .option('--cloud-bucket <bucketName>', 'Name of the cloud storage bucket')
  .option('-d, --db <db>', 'Database type (mysql, postgres, mongodb, sqlite)')
  .action((options: { time?: string; db?: string; cloudProvider?: string; cloudBucket?: string }) => {
    console.log('Schedule command options:', options);
    try {
      if (!options.time) {
        logger.error('Cron time is required to schedule backups');
        process.exit(1);
      }

      const backupOption: BackupOptions = {
        db: options.db || '',
        cloud: options.cloudProvider && options.cloudBucket
          ? {
              provider: options.cloudProvider,
              bucketName: options.cloudBucket
            }
          : undefined
      };

      const scheduleOptions: ScheduleOptions = {
        time: options.time,
        backupOption
      };

      scheduleBackup(scheduleOptions);
      logger.info(`Backup scheduled with cron time: ${options.time}`);
    } catch (error) {
      logger.error(`Scheduling backup failed: ${error}`);
    }
  });

// Add custom help text
program.addHelpText('after', `
Example usage:
  $ db-backup-utility backup --db postgres --cloud-provider aws --cloud-bucket my-bucket
  $ db-backup-utility restore --file /path/to/backup
  $ db-backup-utility schedule --time "0 0 * * *" --db mysql

For more information, visit https://github.com/SamMintah/database-backup-utility/tree/main
`);

// Display help after error
program.showHelpAfterError('(add --help for additional information)');

// Parse the command line arguments
program.parse(process.argv);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
