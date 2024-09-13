import { IncomingWebhook } from '@slack/webhook';
import * as dotenv from 'dotenv';

dotenv.config();
const webhookUrl = process.env.SLACK_WEBHOOK_URL;

if (!webhookUrl) {
  throw new Error('SLACK_WEBHOOK_URL is not defined in the environment variables');
}

const webhook = new IncomingWebhook(webhookUrl);
export async function sendSlackNotification(message: string) {
  await webhook.send({
    text: message
  });
}
