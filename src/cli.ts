"use strict";
import { Command } from 'commander';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { backupDatabase } from './backup/backupService';
import { restoreDatabase } from './restore/restoreService';
import { scheduleBackup } from './schedule/scheduler';
import { sendSlackNotification } from './utils/slack';
import { BackupOptions } from './type';

dotenv.config();

const program = new Command();
program
  .name('db-backup-utility')
  .description('CLI tool to backup, restore, and schedule database backups')
  .version('1.0.0');

// Backup command
program
  .command('backup')
  .description('Backs up the database')
  .option(
    '-d, --db <type>',
    'Specify the database type (mysql, postgres, mongodb, sqlite)'
  )
  .action(async (options) => {
    try {
      await backupDatabase(options.db);
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
  .description('Restores the database from a backup file')
  .option('-f, --file <path>', 'Path to the backup file')
  .action(async (options) => {
    try {
      await restoreDatabase(options.file);
      logger.info('Restore completed successfully');
      await sendSlackNotification('Restore completed successfully');
    } catch (error) {
      logger.error(`Restore failed: ${error}`);
      await sendSlackNotification('Restore failed');
    }
  });

// Schedule backup command
program
  .command('schedule')
  .description('Schedules automatic backups using a cron expression')
  .option('-t, --time <cron>', 'Cron expression to schedule backups')
  .action((options) => {
    try {
      const backupOptions: BackupOptions = {
        db: options.db
      };

      scheduleBackup(options.time, backupOptions);
      logger.info(`Backup scheduled with cron time: ${options.time}`);
    } catch (error) {
      logger.error(`Scheduling backup failed: ${error}`);
    }
  });

// Help and usage information
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
