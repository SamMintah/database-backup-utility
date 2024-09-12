import cron from 'node-cron';
import { backupDatabase } from '../backup/backupService';
import { BackupOptions } from '../type';

export function scheduleBackup(cronTime: string, backupOptions: BackupOptions) {
  cron.schedule(cronTime, () => {
    backupDatabase(backupOptions);
  });
}
