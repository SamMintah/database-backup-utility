import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';

// Define the expected structure of the answers
interface ConfigAnswers {
  dbType: 'mysql' | 'postgres' | 'mongodb' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  filename?: string;
  useCloud: boolean;
  cloudProvider?: 'aws' | 'gcp' | 'azure';
  cloudBucket?: string;
  backupPath: string;
}

export async function configWizard() {
  // Define your questions
  const questions = [
    {
      type: 'list',
      name: 'dbType',
      message: 'Select your database type:',
      choices: ['mysql', 'postgres', 'mongodb', 'sqlite'],
    },
    {
      type: 'input',
      name: 'host',
      message: 'Enter your database host:',
      when: (answers: ConfigAnswers) => answers.dbType !== 'sqlite',
    },
    {
      type: 'input',
      name: 'port',
      message: 'Enter your database port:',
      when: (answers: ConfigAnswers) => answers.dbType !== 'sqlite',
      default: (answers: ConfigAnswers) => {
        switch (answers.dbType) {
          case 'mysql': return 3306;
          case 'postgres': return 5432;
          case 'mongodb': return 27017;
          default: return undefined;
        }
      },
    },
    {
      type: 'input',
      name: 'username',
      message: 'Enter your database username:',
      when: (answers: ConfigAnswers) => answers.dbType !== 'sqlite',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your database password:',
      when: (answers: ConfigAnswers) => answers.dbType !== 'sqlite',
    },
    {
      type: 'input',
      name: 'database',
      message: 'Enter your database name:',
      when: (answers: ConfigAnswers) => answers.dbType !== 'sqlite',
    },
    {
      type: 'input',
      name: 'filename',
      message: 'Enter the path to your SQLite database file:',
      when: (answers: ConfigAnswers) => answers.dbType === 'sqlite',
    },
    {
      type: 'confirm',
      name: 'useCloud',
      message: 'Do you want to use cloud storage?',
    },
    {
      type: 'list',
      name: 'cloudProvider',
      message: 'Select your cloud provider:',
      choices: ['aws', 'gcp', 'azure'],
      when: (answers: ConfigAnswers) => answers.useCloud,
    },
    {
      type: 'input',
      name: 'cloudBucket',
      message: 'Enter your cloud storage bucket name:',
      when: (answers: ConfigAnswers) => answers.useCloud,
    },
    {
      type: 'input',
      name: 'backupPath',
      message: 'Enter the local path for storing backups:',
      default: path.join(process.cwd(), 'backups'),
    },
  ];

  // Prompt the user for answers
  const answers = await inquirer.prompt(questions);

  // Prepare configuration object
  const config = {
    db: {
      type: answers.dbType,
      [answers.dbType]: answers.dbType === 'sqlite'
        ? { filename: answers.filename }
        : {
            host: answers.host,
            port: answers.port,
            username: answers.username,
            password: answers.password,
            database: answers.database,
          }
    },
    cloud: answers.useCloud
      ? {
          provider: answers.cloudProvider,
          bucket: answers.cloudBucket,
        }
      : undefined,
    backupPath: answers.backupPath,
  };

  // Save configuration to file
  const configPath = path.join(process.cwd(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`Configuration saved to ${configPath}`);
}




