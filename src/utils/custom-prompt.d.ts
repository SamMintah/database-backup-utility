// custom-prompt.d.ts
import * as inquirer from 'inquirer';

declare module 'inquirer' {
  interface QuestionMap {
    custom: { message: string; option: number[] }; 
  }
}
