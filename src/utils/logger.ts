import * as winston from 'winston';
import * as path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Log to a file
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/backup.log'), level: 'info' }),
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
  ],
});

// Log to console if not in production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
