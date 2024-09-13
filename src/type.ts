// src/type.ts
export interface BackupOptions {
  db: string;
  cloud?: {
    provider: string; 
    bucketName: string; 
  };
}

export interface RestoreOptions {
  db: string;
  file?: string;  
  cloud?: {
    provider: string;  
    bucketName: string;  
  };
}


export interface ScheduleOptions {
  time: string;
  backupOption: BackupOptions; 
}

export interface CloudStorage {
  upload(filePath: string, bucketName: string): Promise<void>;
}
