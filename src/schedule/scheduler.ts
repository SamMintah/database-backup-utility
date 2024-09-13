import * as cron from 'node-cron';
import { backupDatabase } from '../backup/backupService';
import { ScheduleOptions} from '../type';

export function scheduleBackup(options: ScheduleOptions) {
  const { backupOption,time } = options;
  cron.schedule(time, () => {
    backupDatabase(backupOption);
  });
}
