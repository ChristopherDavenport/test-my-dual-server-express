import winston from "winston"
import expressWinston from "express-winston"

const logger = expressWinston.logger(
  {
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
    ]
  }
)

const errorLogger = expressWinston.errorLogger(
  {
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
    ]
  }
)

export default {
  logger,
  errorLogger
}