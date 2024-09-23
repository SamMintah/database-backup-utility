**Database Backup Utility**  
A Node.js CLI tool for backing up and restoring multiple types of databases (MySQL, PostgreSQL, MongoDB, SQLite). Supports full, incremental, and differential backups, with options for local and cloud storage (AWS S3, Google Cloud Storage, Azure Blob). Includes automatic backup scheduling, compression, and logging of activities.  

---

**Features:**
- Supports MySQL, PostgreSQL, MongoDB, SQLite
- Full, incremental, and differential backups
- Backup compression to save storage space
- Local and cloud storage options
- Backup scheduling and logging
- Easy restoration with selective restore options
- Notifications via Slack
  
---

## **Usage:**

To see the available commands and options, run:


```bash
npm run help

> database-backup-utility@1.0.0 help
> ts-node ./src/cli.ts

Usage: db-backup-utility [command] [options]

CLI tool to backup, restore, and schedule database backups

Options:
  -V, --version       output the version number
  -h, --help          display help for command

Commands:
  configure           Run the configuration wizard for database setup
  backup [options]    Backs up the database
  restore [options]   Restores the database from a backup file or cloud storage
  schedule [options]  Schedules automatic backups using a cron expression
  list [options]      List existing backups
  help [command]      display help for command

```


**Tech Stack:**
- Node.js
- Commander.js (CLI framework)
- MySQL, PostgreSQL, MongoDB, SQLite
- Cloud Storage: AWS S3, Google Cloud Storage, Azure Blob
- Compression: zlib
- Logging: Winston

---

<img width="602" alt="Screenshot 2024-09-23 at 6 38 51 PM" src="https://github.com/user-attachments/assets/fbc8a366-bcba-49c2-b3b1-e19eb803c9a4">

