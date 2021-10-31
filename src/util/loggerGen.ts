import { RequestId } from "../middleware/requestId"
import winston, {Logger} from "winston"

export const iLogger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ]
})

const logger: (id: RequestId) => Logger = (id) => {
  return iLogger.child({
    "request.id": id
  })
}

export default {
  logger,
}